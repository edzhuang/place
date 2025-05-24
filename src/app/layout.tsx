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
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/NavigationMenu";
import Image from "next/image";
import Link from "next/link";
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
  icons: [
    {
      rel: "icon",
      type: "image/x-icon",
      url: "/favicon-light.ico",
      media: "(prefers-color-scheme: light)",
    },
    {
      rel: "icon",
      type: "image/png",
      url: "/favicon-dark.ico",
      media: "(prefers-color-scheme: dark)",
    },
  ],
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
        <body
          className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        >
          <ThemeProvider
            defaultTheme="dark"
            attribute="class"
            disableTransitionOnChange
          >
            <NavigationMenu>
              <NavigationMenuList>
                <Link href="/" className="mr-3">
                  <Image
                    src="/logo-dark.png"
                    width={1600}
                    height={1600}
                    alt="Workmark"
                    className="h-8 w-auto"
                    priority={true}
                  />
                </Link>

                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle()}
                    asChild
                  >
                    <Link href="/about">About</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle()}
                    asChild
                  >
                    <Link href="https://github.com/edzhuang/place">GitHub</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
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

            <main>
              <CanvasProvider>{children}</CanvasProvider>
            </main>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
