"use client"; // Required for context and hooks

import { Canvas } from "@/components/Canvas";
import { CanvasProvider } from "@/contexts/CanvasContext";

export default function HomePage() {
  return (
    <CanvasProvider>
      <main className="flex flex-col items-center justify-center w-screen h-screen bg-gray-200">
        <Canvas />
      </main>
    </CanvasProvider>
  );
}
