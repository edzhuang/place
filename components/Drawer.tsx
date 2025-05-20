"use client";

import { Palette } from "@/components/Palette";
import { Button } from "@/components/ui/Button";
import { useCanvas } from "@/contexts/CanvasContext";

export function Drawer() {
  const { setSelectedPixel, placePixel } = useCanvas();

  return (
    <div className="w-full flex flex-col bg-background/90 backdrop-blur-lg justify-evenly h-32 px-8 items-center border-t">
      <Palette />
      <div className="flex flex-row gap-2">
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
    </div>
  );
}
