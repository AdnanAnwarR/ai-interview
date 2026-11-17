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
      <body className="min-h-full flex flex-col bg-[#EAF2FE] text-[#1B2A41]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
