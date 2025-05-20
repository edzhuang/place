"use client";

import {
  NavigationMenu as UiNavigationMenu, // Alias the imported component
  NavigationMenuList,
} from "~/components/ui/NavigationMenu";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/Button";

export function Header() {
  const router = useRouter();

  return (
    <UiNavigationMenu>
      <NavigationMenuList>
        <Link href="/">
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
      <NavigationMenuList className="pointer-events-none">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/auth/login")}
          className="pointer-events-auto"
        >
          Log in
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="pointer-events-auto"
          onClick={() => router.push("/auth/sign-up")}
        >
          Sign up
        </Button>
      </NavigationMenuList>
    </UiNavigationMenu>
  );
}
