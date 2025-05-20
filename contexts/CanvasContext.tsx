"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from "react";
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from "@/constants/canvas";
import { useSession, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";

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

// Define an interface for the structure of pixel data from Supabase
interface SupabasePixel {
  x: number;
  y: number;
  color: string;
  // Add any other fields that might be part of your pixel data
}

export const CanvasProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn } = useUser();
  const { session } = useSession();

  const client = useMemo(() => {
    function createClerkSupabaseClient() {
      return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          async accessToken() {
            return session?.getToken() ?? null;
          },
        }
      );
    }

    return createClerkSupabaseClient();
  }, [session]);

  const [pixels, setPixels] = useState<string[][]>([[]]);
  const [isLoading, setIsLoading] = useState(true);
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
      const { data, error } = await client
        .from(PIXELS_TABLE)
        .select("x, y, color");

      if (error) {
        console.error("Error fetching pixels:", error);
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
  }, [client]);

  useEffect(() => {
    if (!isSignedIn) return;

    // Subscribe to real-time changes on the PIXELS_TABLE
    const channel = client
      .channel("realtime-pixels-updates") // Unique channel name
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public", // Or your specific schema if not public
          table: PIXELS_TABLE,
        },
        (payload) => {
          console.log("Realtime change received!", payload);
          const { new: newRecord, old: oldRecord, eventType } = payload;

          // Type guard to ensure the record is a SupabasePixel
          const isSupabasePixel = (
            record: unknown
          ): record is SupabasePixel => {
            return (
              typeof record === "object" &&
              record !== null &&
              "x" in record &&
              typeof (record as SupabasePixel).x === "number" &&
              "y" in record &&
              typeof (record as SupabasePixel).y === "number" &&
              "color" in record &&
              typeof (record as SupabasePixel).color === "string"
            );
          };

          if (eventType === "INSERT" || eventType === "UPDATE") {
            if (isSupabasePixel(newRecord)) {
              setPixels((prevPixels) => {
                if (
                  !Array.isArray(prevPixels) ||
                  !Array.isArray(prevPixels[0])
                ) {
                  console.warn(
                    "prevPixels is not in the expected format, re-fetching might be needed or check initial state."
                  );
                  const initialSafePixels = Array(CANVAS_HEIGHT)
                    .fill(null)
                    .map(() => Array(CANVAS_WIDTH).fill("#FFFFFF"));
                  if (
                    newRecord.y >= 0 &&
                    newRecord.y < CANVAS_HEIGHT &&
                    newRecord.x >= 0 &&
                    newRecord.x < CANVAS_WIDTH
                  ) {
                    initialSafePixels[newRecord.y][newRecord.x] =
                      newRecord.color;
                  }
                  return initialSafePixels;
                }

                const updatedPixels = prevPixels.map((row) => [...row]);
                if (
                  newRecord.y >= 0 &&
                  newRecord.y < CANVAS_HEIGHT &&
                  newRecord.x >= 0 &&
                  newRecord.x < CANVAS_WIDTH
                ) {
                  updatedPixels[newRecord.y][newRecord.x] = newRecord.color;
                }
                return updatedPixels;
              });
            }
          } else if (eventType === "DELETE") {
            if (isSupabasePixel(oldRecord)) {
              setPixels((prevPixels) => {
                if (
                  !Array.isArray(prevPixels) ||
                  !Array.isArray(prevPixels[0])
                ) {
                  console.warn(
                    "prevPixels is not in the expected format for DELETE."
                  );
                  return Array(CANVAS_HEIGHT)
                    .fill(null)
                    .map(() => Array(CANVAS_WIDTH).fill("#FFFFFF"));
                }
                const updatedPixels = prevPixels.map((row) => [...row]);
                if (
                  oldRecord.y >= 0 &&
                  oldRecord.y < CANVAS_HEIGHT &&
                  oldRecord.x >= 0 &&
                  oldRecord.x < CANVAS_WIDTH
                ) {
                  updatedPixels[oldRecord.y][oldRecord.x] = "#FFFFFF"; // Revert to default color
                }
                return updatedPixels;
              });
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to realtime pixel changes!");
        }
        if (status === "CHANNEL_ERROR") {
          console.error(`Failed to subscribe: ${err?.message}`);
        }
        if (status === "TIMED_OUT") {
          console.error("Subscription timed out");
        }
      });

    // Cleanup function to remove the channel subscription when the component unmounts
    return () => {
      client.removeChannel(channel);
    };
  }, [isSignedIn, client]);

  const placePixel = async () => {
    if (!isSignedIn || isLoading) return;

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
      const { error } = await client.from(PIXELS_TABLE).upsert(
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
