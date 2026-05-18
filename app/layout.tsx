import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { getToken } from "@/lib/auth-server";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Tascboard",
  description: "An ERP & Project Mangement App for Organization.",
  icons: {
    icon: "/convex.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getToken();
  return (
    <html
      lang="en"
      className={cn(
        "font-sans antialiased",
        ibmPlexSans.variable,
        jetbrainsMono.variable,
      )}
    >
      <body>
        <ConvexClientProvider initialToken={token}>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
