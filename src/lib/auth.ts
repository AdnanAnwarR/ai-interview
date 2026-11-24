import { getServerSession, type DefaultSession, type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      credits?: number;
      subscriptionUntil?: Date | null;
    } & DefaultSession['user'];
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-google-client-secret',
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Nama', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        try {
          const email = credentials.email.trim().toLowerCase();
          const password = credentials.password || '';
          const name = credentials.name?.trim() || email.split('@')[0];

          let user = await db.user.findUnique({
            where: { email },
          });

          if (!user) {
            user = await db.user.create({
              data: {
                email,
                name,
                password,
                credits: 1, // Sesi gratis awal = 1 per akun
              },
            });
          } else {
            // Jika akun sudah memiliki kata sandi, validasi kecocokannya
            if (user.password && user.password !== password) {
              return null;
            }
            if (!user.password && password) {
              user = await db.user.update({
                where: { email },
                data: { password },
              });
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (err) {
          console.error('Credentials auth error:', err);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      // Jika login menggunakan credentials, akun sudah divalidasi dan dibuat
      if (account?.provider === 'credentials') {
        return true;
      }
      try {
        // Upsert user to ensure initial 1 credit for OAuth (misal Google)
        await db.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            image: user.image,
          },
          create: {
            email: user.email,
            name: user.name,
            image: user.image,
            credits: 1, // Sesi gratis awal = 1 per akun
          },
        });
        return true;
      } catch (err) {
        console.error('Error during signIn user sync:', err);
        return true; // allow signin even if DB is temporarily offline
      }
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;

        // Populate latest user credits & subscription
        try {
          if (session.user.email) {
            const dbUser = await db.user.findUnique({
              where: { email: session.user.email },
            });
            if (dbUser) {
              session.user.id = dbUser.id;
              session.user.credits = dbUser.credits;
              session.user.subscriptionUntil = dbUser.subscriptionUntil;
            }
          }
        } catch {
          // ignore error
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'wawancarain-secret-key-32-chars-minimum-length',
};

/**
 * Mengambil data pengguna yang terautentikasi dan terverifikasi di database.
 * Jika pengguna belum ada di sesi Google tapi aplikasi dalam mode development,
 * fallback ke akun pengujian lokal terisolasi agar developer dapat mengetes langsung.
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    let user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || 'Pengguna Wawancarain',
          image: session.user.image,
          credits: 1,
        },
      });
    }

    return user;
  }

  // Fallback pengujian untuk lingkungan development / sandbox jika sesi Google belum terpasang
  if (process.env.NODE_ENV !== 'production') {
    const demoEmail = 'dev-candidate@wawancarain.id';
    let devUser = await db.user.findUnique({
      where: { email: demoEmail },
    });

    if (!devUser) {
      devUser = await db.user.create({
        data: {
          id: 'dev_user_wawancarain',
          email: demoEmail,
          name: 'Developer Test Candidate',
          credits: 3,
        },
      });
    }

    return devUser;
  }

  return null;
}
