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

// Warm Superstack theming for every Clerk component (SignIn, SignUp, UserButton).
const clerkAppearance: React.ComponentProps<typeof ClerkProvider>["appearance"] =
  {
    variables: {
      colorPrimary: "#EC5B13",
      colorForeground: "#1C1712",
      colorBackground: "#FFFDF8",
      colorInput: "#FFFFFF",
      colorInputForeground: "#1C1712",
      colorBorder: "#E8DFCE",
      colorMutedForeground: "#8A7B63",
      colorRing: "#EC5B13",
      borderRadius: "10px",
      fontFamily: "var(--font-archivo), sans-serif",
    },
    elements: {
      // Chunky ink-outlined card, same recipe as the app's containers.
      // width/maxWidth keep it inside narrow viewports (auth shells cap it).
      cardBox: {
        border: "1.5px solid #1C1712",
        boxShadow: "0 4px 0 #1C1712",
        backgroundColor: "#FFFDF8",
        width: "100%",
        maxWidth: "25rem",
      },
      card: {
        backgroundColor: "#FFFDF8",
      },
      headerSubtitle: {
        color: "#8A7B63",
      },
      formFieldLabel: {
        fontWeight: 600,
      },
      // Inputs follow the app's field recipe: 1.5px --input border,
      // orange on focus (ring color comes from variables.colorRing).
      formFieldInput: {
        borderWidth: "1.5px",
        borderColor: "#DACFB9",
        "&:focus": {
          borderColor: "#EC5B13",
        },
      },
      dividerLine: {
        backgroundColor: "#E8DFCE",
      },
      dividerText: {
        color: "#8A7B63",
      },
      // Warm footer strip instead of Clerk's stock gray gradient.
      footer: {
        background: "#F9F4EA",
      },
      // Match Button variant="brand": bold pressable CTA with a bottom shadow.
      formButtonPrimary: {
        backgroundColor: "#EC5B13",
        border: "1px solid #EC5B13",
        boxShadow: "0 2px 0 #C4470B",
        fontWeight: 700,
        textTransform: "none",
        "&:hover": {
          backgroundColor: "#D94F0C",
          borderColor: "#D94F0C",
        },
        "&:active": {
          transform: "translateY(1px)",
          boxShadow: "0 1px 0 #C4470B",
        },
      },
      socialButtonsBlockButton: {
        border: "1.5px solid #DACFB9",
        fontWeight: 600,
        "&:hover": {
          borderColor: "#EC5B13",
        },
      },
      headerTitle: {
        fontWeight: 900,
        letterSpacing: "-0.02em",
      },
      footerActionLink: {
        color: "#EC5B13",
        fontWeight: 700,
        "&:hover": {
          color: "#D94F0C",
        },
      },
      // UserButton dropdown inherits the same chunky card treatment.
      userButtonPopoverCard: {
        border: "1.5px solid #1C1712",
        boxShadow: "0 4px 0 #1C1712",
        backgroundColor: "#FFFDF8",
      },
    },
  };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
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
