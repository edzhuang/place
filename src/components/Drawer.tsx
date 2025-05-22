"use client";

import { Palette } from "@/components/Palette";
import { Button } from "@/components/ui/Button";
import { useCanvas } from "@/contexts/CanvasContext";
import { SignInButton, useUser } from "@clerk/nextjs";

function DrawerOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-xl">
      {children}
    </div>
  );
}

export function Drawer() {
  const { setSelectedPixel, placePixel } = useCanvas();
  const { isSignedIn } = useUser();

  return (
    <div className="relative w-full flex flex-col bg-background justify-evenly h-32 px-8 items-center border-t">
      <Palette />
      <div className="flex flex-row gap-1">
        <Button
          variant="outline"
          size="md"
          onClick={() => setSelectedPixel(null)}
        >
          Cancel
        </Button>
        <Button variant="primary" size="md" onClick={placePixel}>
          Place
        </Button>
      </div>

      {!isSignedIn && (
        <DrawerOverlay>
          <div className="flex items-center">
            <SignInButton>
              <div className="text-muted-foreground hover:text-foreground hover:[&>code]:text-foreground underline underline-offset-[5px] transition-colors cursor-pointer font-bold">
                Sign in
              </div>
            </SignInButton>
            &nbsp;to place a pixel
          </div>
        </DrawerOverlay>
      )}
    </div>
  );
}
