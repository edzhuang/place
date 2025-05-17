"use client";

import type React from "react";
import { createContext, useContext, useState, ReactNode } from "react";
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from "@/constants/canvas";

interface CanvasContextState {
  pixels: string[][];
  setPixels: React.Dispatch<React.SetStateAction<string[][]>>;
  selectedColor: string;
  setSelectedColor: React.Dispatch<React.SetStateAction<string>>;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  position: { x: number; y: number };
  setPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  dragStart: { x: number; y: number };
  setDragStart: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}

const CanvasContext = createContext<CanvasContextState | undefined>(undefined);

export const CanvasProvider = ({ children }: { children: ReactNode }) => {
  const [pixels, setPixels] = useState<string[][]>(() =>
    Array(CANVAS_HEIGHT)
      .fill(null)
      .map(() => Array(CANVAS_WIDTH).fill("#FFFFFF"))
  );
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const contextValue = {
    pixels,
    setPixels,
    selectedColor,
    setSelectedColor,
    zoom,
    setZoom,
    position,
    setPosition,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
  };

  return (
    <CanvasContext.Provider value={contextValue}>
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error("useCanvas must be used within a CanvasProvider");
  }
  return context;
};
