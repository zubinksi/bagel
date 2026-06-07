import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Bebas_Neue } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });

export const metadata: Metadata = {
  title: "Bagel Watch",
  description: "The league's official record of every starter who scored a goose egg.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${bebas.variable} font-[var(--font-geist)] bg-[#09090B] text-white min-h-screen`}>
        <div className="max-w-md mx-auto min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
