"use client"; // Required for context and hooks

import { Canvas } from "@/components/Canvas";
import { CanvasProvider } from "@/contexts/CanvasContext";

export default function HomePage() {
  return (
    <CanvasProvider>
      <main className="flex flex-col items-center justify-center w-screen h-screen p-4 bg-gray-100">
        <div className="w-full max-w-6xl h-[calc(100vh-2rem)] flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-center text-gray-700">
            Collaborative Pixel Canvas
          </h1>
          <Canvas />
        </div>
      </main>
    </CanvasProvider>
  );
}
