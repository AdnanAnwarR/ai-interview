import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wawancarain - Simulasi Wawancara Kerja AI untuk Mahasiswa & Fresh Graduate",
  description: "Platform latihan wawancara kerja interaktif berbahasa Indonesia dengan AI realtime dan evaluasi mendalam per jawaban.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className="h-full antialiased font-sans"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F6F9FE] text-[#1B2A41]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
