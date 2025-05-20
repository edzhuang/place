import "./globals.css";

import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CanvasProvider } from "@/contexts/CanvasContext";
import { ThemeProvider } from "next-themes";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/NavigationMenu";
import Image from "next/image";
import Link from "next/link";
import { ReactScan } from "@/components/ReactScan";
import React from "react";
import { Button } from "@/components/ui/Button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Place",
  description: "Recreation of Reddit's r/place",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <ReactScan />
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            defaultTheme="dark"
            attribute="class"
            disableTransitionOnChange
          >
            <NavigationMenu>
              <NavigationMenuList>
                <Link href="/" className="p-2">
                  <Image
                    src="/wordmark.svg"
                    width={772}
                    height={200}
                    alt="Picture of the author"
                    className="w-auto h-6"
                    priority={true}
                  />
                </Link>
              </NavigationMenuList>
              <NavigationMenuList>
                <SignedOut>
                  <SignInButton>
                    <Button size="sm" variant="outline">
                      Sign in
                    </Button>
                  </SignInButton>
                  <SignUpButton>
                    <Button size="sm" variant="primary">
                      Sign up
                    </Button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </NavigationMenuList>
            </NavigationMenu>

            <CanvasProvider>
              <main>{children}</main>
            </CanvasProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
