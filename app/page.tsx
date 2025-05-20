"use client";

import { Canvas } from "@/components/Canvas";
import { Drawer } from "@/components/Drawer";
import { useCanvas } from "@/contexts/CanvasContext";
import { ZoomControls } from "@/components/ZoomControls";

import clsx from "clsx";

export default function HomePage() {
  const { selectedPixel } = useCanvas();

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
          <ZoomControls />
        </div>
        <div className="pointer-events-auto">
          <Drawer />
        </div>
      </div>
    </>
  );
}
