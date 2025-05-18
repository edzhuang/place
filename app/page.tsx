"use client";

import {
  NavigationMenu,
  NavigationMenuList,
} from "~/components/ui/NavigationMenu";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/Button";
import { Canvas } from "@/components/Canvas";
import { CanvasProvider } from "@/contexts/CanvasContext";

export default function HomePage() {
  const router = useRouter();

  return (
    <CanvasProvider>
      <NavigationMenu>
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
      </NavigationMenu>

      <main className="flex flex-col items-center justify-center w-screen h-screen bg-gray-200">
        <Canvas />
      </main>
    </CanvasProvider>
  );
}
