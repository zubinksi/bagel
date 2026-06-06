import type { Metadata } from "next";
import { Geist } from "next/font/google";
import NavBar from "@/components/NavBar";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bagel Board",
  description: "Fantasy football bagel tracker — zero points, beer chug required.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-zinc-950 text-white min-h-screen`}>
        <NavBar />
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
