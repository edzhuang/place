"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from "@/constants/canvas";
import { createClient } from "@/utils/supabase/client";

interface CanvasContextState {
  pixels: string[][];
  setPixels: React.Dispatch<React.SetStateAction<string[][]>>;
  selectedPixel: { x: number; y: number } | null;
  setSelectedPixel: React.Dispatch<
    React.SetStateAction<{ x: number; y: number } | null>
  >;
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
  placePixel: () => Promise<void>; // Modified to be async
  isLoading: boolean; // To indicate loading state
}

const CanvasContext = createContext<CanvasContextState | undefined>(undefined);

// Define your database and table names
const PIXELS_TABLE = "pixels"; // Replace with your actual table name

export const CanvasProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClient(); // Initialize Supabase client
  const [pixels, setPixels] = useState<string[][]>([[]]);
  const [isLoading, setIsLoading] = useState(true);
  // ...existing state declarations...
  const [selectedPixel, setSelectedPixel] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchInitialPixels = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from(PIXELS_TABLE)
        .select("x, y, color");

      if (error) {
        console.error("Error fetching pixels:", error);
        // Keep the default empty canvas or handle error appropriately
        setIsLoading(false);
        return;
      }

      if (data) {
        const newPixels = Array(CANVAS_HEIGHT)
          .fill(null)
          .map(() => Array(CANVAS_WIDTH).fill("#FFFFFF")); // Start with a white canvas

        data.forEach((pixel) => {
          if (
            pixel.y >= 0 &&
            pixel.y < CANVAS_HEIGHT &&
            pixel.x >= 0 &&
            pixel.x < CANVAS_WIDTH
          ) {
            newPixels[pixel.y][pixel.x] = pixel.color;
          }
        });
        setPixels(newPixels);
      }
      setIsLoading(false);
    };

    fetchInitialPixels();
  }, [supabase]); // Re-run if supabase client instance changes, though unlikely

  const placePixel = async () => {
    if (selectedPixel) {
      const newPixels = pixels.map((row, y) =>
        row.map((pixelColor, x) => {
          if (x === selectedPixel.x && y === selectedPixel.y) {
            return selectedColor;
          }
          return pixelColor;
        })
      );
      setPixels(newPixels);

      // Update Supabase
      const { error } = await supabase.from(PIXELS_TABLE).upsert(
        {
          x: selectedPixel.x,
          y: selectedPixel.y,
          color: selectedColor,
        },
        { onConflict: "x,y" }
      );

      if (error) {
        console.error("Error updating pixel in Supabase:", error);
      }
    }
  };

  const contextValue = {
    pixels,
    setPixels,
    selectedPixel,
    setSelectedPixel,
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
    placePixel,
    isLoading,
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
