"use client";

import { Canvas } from "@/components/Canvas";
import { Drawer } from "@/components/Panel";
import { useCanvas } from "@/contexts/CanvasContext";
import { ZoomControls } from "@/components/ZoomControls";
import { LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

import clsx from "clsx";

export default function HomePage() {
  const { isLoading, selectedPixel, hoveredPixel } = useCanvas();

  return (
    <div className="flex flex-col h-screen justify-center items-center">
      {/* Canvas */}
      {isLoading ? (
        <LoaderCircle className="h-12 w-12 animate-spin text-muted-foreground" />
      ) : (
        <Canvas />
      )}

      {/* Top UI */}
      <div className="fixed top-22 inset-x-0 flex flex-col items-center">
        {hoveredPixel && (
          <Badge variant="outline" className="bg-background gap-4 font-mono">
            ({hoveredPixel.x}, {hoveredPixel.y})
          </Badge>
        )}
      </div>

      {/* Bottom UI */}
      <div
        className={clsx(
          "fixed bottom-0 inset-x-0 flex flex-col z-10 pointer-events-none transition-transform duration-300 ease-in-out",
          { "translate-y-32": !selectedPixel }
        )}
      >
        <div className="flex justify-end p-6">
          <ZoomControls />
        </div>
        <div className="pointer-events-auto">
          <Drawer />
        </div>
      </div>
    </div>
  );
}
