"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
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
import { Button } from "@/components/ui/Button";
import { AboutDialog } from "@/components/AboutDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function Header() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem className="flex">
          <NavigationMenuLink asChild>
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
                <div className="text-5 font-medium">Place</div>
              </div>
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <AboutDialog>
          <NavigationMenuItem className="cursor-pointer hidden md:flex">
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              About
            </NavigationMenuLink>
          </NavigationMenuItem>
        </AboutDialog>

        <NavigationMenuItem className="hidden md:flex">
          <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
            <Link href="https://github.com/edzhuang/place">GitHub</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>

      <NavigationMenuList>
        <SignedOut>
          <NavigationMenuItem>
            <SignInButton>
              <Button size="xs" variant="ghost">
                Sign in
              </Button>
            </SignInButton>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <SignUpButton>
              <Button size="xs" variant="primary">
                Sign up
              </Button>
            </SignUpButton>
          </NavigationMenuItem>
        </SignedOut>

        <SignedIn>
          <NavigationMenuItem className="flex">
            <UserButton
              fallback={<Skeleton className="size-7 rounded-full" />}
            />
          </NavigationMenuItem>
        </SignedIn>

        <Drawer>
          <DrawerTrigger className="ml-4 md:hidden">
            <NavigationMenuItem>
              <Menu />
            </NavigationMenuItem>
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
              <div className="overflow-auto p-2 min-h-[70dvh]">
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
  );
}

export { Header };
