"use client";

import { Button } from "~/components/ui/Button";
import { Canvas } from "@/components/Canvas";
import { Drawer } from "@/components/Drawer";
import { Plus, Minus } from "lucide-react";
import { useCanvas } from "@/contexts/CanvasContext";
import clsx from "clsx";

export default function HomePage() {
  const { zoom, setZoom, selectedPixel } = useCanvas();

  return (
    <>
      <Canvas />

      <div
        className={clsx(
          "fixed bottom-0 inset-x-0 flex flex-col z-10 pointer-events-none transition-transform duration-300 ease-in-out",
          { "translate-y-32": !selectedPixel }
        )}
      >
        <div className="flex justify-end p-8">
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="md"
              subject="icon"
              onClick={() => setZoom(zoom + 0.1)}
              className="pointer-events-auto"
            >
              <Plus />
            </Button>
            <Button
              variant="outline"
              size="md"
              subject="icon"
              onClick={() => setZoom(zoom - 0.1)}
              className="pointer-events-auto"
            >
              <Minus />
            </Button>
          </div>
        </div>
        <div className="pointer-events-auto">
          <Drawer />
        </div>
      </div>
    </>
  );
}
