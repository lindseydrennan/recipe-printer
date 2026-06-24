import type { Metadata } from "next";
import Image from "next/image";
import { Libre_Baskerville, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Recipe Printer",
  description: "Turn any recipe URL into a printable PDF.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${libreBaskerville.variable} ${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="w-full max-w-[1280px] mx-auto px-6 pt-6">
          <Image src="/favicon.png" alt="Lindsey Drennan logo" width={36} height={36} />
        </header>
        <div className="flex flex-1 flex-col w-full max-w-[1280px] mx-auto">
          {children}
        </div>
        <footer className="w-full max-w-[1280px] mx-auto px-6 pb-6">
          <p className="text-xs text-copy/60">
            &copy; {new Date().getFullYear()} Lindsey Drennan
          </p>
        </footer>
      </body>
    </html>
  );
}
