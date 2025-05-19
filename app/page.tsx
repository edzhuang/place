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
import { Drawer } from "@/components/Drawer";
import { Plus, Minus } from "lucide-react";
import { useCanvas } from "@/contexts/CanvasContext";

export default function HomePage() {
  const router = useRouter();
  const { zoom, setZoom } = useCanvas();

  return (
    <>
      {/* Top UI */}
      <div className="fixed top-0 inset-x-0 flex flex-col z-10">
        <NavigationMenu>
          <NavigationMenuList>
            <Link href="/">
              <Image
                src="/light/wordmark.png"
                width={772}
                height={200}
                alt="Picture of the author"
                className="w-auto h-6"
              />
            </Link>
          </NavigationMenuList>
          <NavigationMenuList>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/login")}
            >
              Log in
            </Button>
            <Button variant="primary" size="sm">
              Sign up
            </Button>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <main className="flex flex-col items-center justify-center w-screen h-screen bg-gray-200">
        <Canvas />
      </main>

      {/* Bottom UI */}
      <div className="fixed bottom-0 inset-x-0 flex flex-col z-10">
        <div className="flex justify-end p-8">
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="md"
              subject="icon"
              onClick={() => setZoom(zoom + 0.1)}
            >
              <Plus />
            </Button>
            <Button
              variant="outline"
              size="md"
              subject="icon"
              onClick={() => setZoom(zoom - 0.1)}
            >
              <Minus />
            </Button>
          </div>
        </div>
        <Drawer />
      </div>
    </>
  );
}
