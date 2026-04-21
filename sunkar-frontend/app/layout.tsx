import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import "./globals.css";
import Navbar from "./components/Navbar";
import { Outfit, Lora } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  style: ["normal", "italic"],
});

export const metadata = {
  title: "Sunkar",
  description: "A dark premium synthesis engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} ${lora.variable} antialiased min-h-screen bg-black text-white font-sans selection:bg-emerald-800/80 selection:text-white`}
      >
        <div className="fixed inset-0 bg-black pointer-events-none" />
        <Navbar />
        <main className="relative pt-24 pb-12 z-10 flex flex-col min-h-[calc(100vh-6rem)]">
          {children}
        </main>
      </body>
    </html>
    </ClerkProvider>
  );
}
