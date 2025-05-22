import { Palette } from "@/components/Palette";
import { Button } from "@/components/ui/Button";
import { useCanvas } from "@/contexts/CanvasContext";
import { SignInButton } from "@clerk/nextjs";
import { cooldown } from "@/constants/canvas";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/Progress";

function DrawerOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-xl">
      {children}
    </div>
  );
}

export function Drawer() {
  const { setSelectedPixel, placePixel, isSignedIn, lastPlacedTimestamp } =
    useCanvas();
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    if (lastPlacedTimestamp) {
      const intervalId = setInterval(() => {
        const newRemainingTime = lastPlacedTimestamp + cooldown - Date.now();
        if (newRemainingTime > 0) {
          setRemainingTime(newRemainingTime);
        } else {
          setRemainingTime(0);
          clearInterval(intervalId);
        }
      }, 100);

      // Set initial remaining time
      const initialRemainingTime = lastPlacedTimestamp + cooldown - Date.now();
      setRemainingTime(initialRemainingTime > 0 ? initialRemainingTime : 0);

      return () => clearInterval(intervalId);
    }
  }, [lastPlacedTimestamp]);

  const showCooldownOverlay = lastPlacedTimestamp && remainingTime > 0;
  const secondsLeft = Math.ceil(remainingTime / 1000);

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

      {showCooldownOverlay && isSignedIn && (
        <DrawerOverlay>
          <div className="flex flex-col items-center gap-4">
            <Progress
              className="w-64"
              value={(remainingTime / cooldown) * 100}
            />
            <div className="text-md text-center">
              Next pixel available in {secondsLeft}{" "}
              {secondsLeft === 1 ? "second" : "seconds"}
            </div>
          </div>
        </DrawerOverlay>
      )}
    </div>
  );
}
