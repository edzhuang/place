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
import { VisuallyHidden } from "@/components/ui/_VisuallyHidden";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerHeader,
  DrawerTrigger,
} from "@/components/ui/Drawer";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/Button";
import { AboutDialog } from "@/components/AboutDialog";

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
              {/* Left side */}
              <NavigationMenuList>
                <Link href="/" className="mr-2">
                  <div className="flex items-center gap-2">
                    <Image
                      src="/logo-dark.png"
                      width={1600}
                      height={1600}
                      alt="logo"
                      className="h-5 w-auto"
                      priority={true}
                    />
                    <div className="text-5 font-semibold">Place</div>
                  </div>
                </Link>

                <AboutDialog>
                  <NavigationMenuItem className="cursor-pointer hidden md:flex">
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      About
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </AboutDialog>

                <NavigationMenuItem className="hidden md:flex">
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle()}
                    asChild
                  >
                    <Link href="https://github.com/edzhuang/place">GitHub</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>

              {/* Right side */}
              <NavigationMenuList>
                <SignedOut>
                  <SignInButton>
                    <Button size="sm" variant="ghost">
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

                {/* Mobile menu */}
                <Drawer>
                  <DrawerTrigger>
                    <Menu className="md:hidden ml-4" />
                  </DrawerTrigger>
                  <DrawerContent>
                    <VisuallyHidden>
                      <DrawerHeader>
                        <DrawerTitle>Menu</DrawerTitle>
                        <DrawerDescription>
                          Mobile version of the navigation menu
                        </DrawerDescription>
                      </DrawerHeader>
                    </VisuallyHidden>
                    <DrawerBody>
                      <div className="overflow-auto p-2 min-h-[70vh]">
                        <div className="flex flex-col space-y-3">
                          <AboutDialog>
                            <div className="text-[1.15rem]">About</div>
                          </AboutDialog>
                          <Link
                            href="https://github.com/edzhuang/place"
                            className="text-[1.15rem]"
                          >
                            GitHub
                          </Link>
                        </div>
                      </div>
                    </DrawerBody>
                  </DrawerContent>
                </Drawer>
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
