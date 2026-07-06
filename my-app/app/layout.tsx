import type { Metadata } from "next";
import { Archivo, EB_Garamond, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/navbar1";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Wordmark serif — the "super" in superstack (brand lockup pairing).
const ebGaramond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  style: ["italic"],
  weight: ["600"],
});

export const metadata: Metadata = {
  title: "Superstack — Share your tech stack",
  description:
    "Build your tech stack, get a clean social card, and share it anywhere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${archivo.variable} ${jetbrainsMono.variable} ${ebGaramond.variable} antialiased`}
        >
          <Navbar />
          <ConvexClientProvider>{children}</ConvexClientProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
