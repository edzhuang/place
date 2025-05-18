"use client";

import {
  NavigationMenu,
  NavigationMenuList,
} from "~/components/ui/NavigationMenu";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/Button";
import { Canvas } from "@/components/Canvas";
import { CanvasProvider } from "@/contexts/CanvasContext";

export default function HomePage() {
  const router = useRouter();

  return (
    <CanvasProvider>
      <NavigationMenu>
        <div className="flex items-center justify-between h-full w-full max-w-[1265px]">
          <NavigationMenuList>
            <Link href="/">
              <Image
                src="/light/wordmark.svg"
                width={772}
                height={200}
                alt="Picture of the author"
                style={{
                  width: "auto",
                  height: "28px",
                }}
              />
            </Link>
          </NavigationMenuList>
          <NavigationMenuList>
            <Button
              variant="outline"
              size="md"
              onClick={() => router.push("/login")}
            >
              Log in
            </Button>
            <Button variant="primary" size="md">
              Sign up
            </Button>
          </NavigationMenuList>
        </div>
      </NavigationMenu>

      <main className="flex flex-col items-center justify-center w-screen h-screen bg-gray-200">
        <Canvas />
      </main>
    </CanvasProvider>
  );
}
