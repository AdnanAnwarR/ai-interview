import { getServerSession, type DefaultSession, type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
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
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      try {
        // Upsert user to ensure initial 1 credit
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
