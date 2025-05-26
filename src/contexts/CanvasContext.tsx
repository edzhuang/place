"use client";

import type React from "react";
import { useCallback } from "react";
import type { Pixel, Coordinates, CanvasContextState } from "@/types/canvas";
import { PIXELS_TABLE } from "@/constants/canvas";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from "react";
import {
  COLORS,
  DEFAULT_PIXEL_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MAX_ZOOM,
  MIN_ZOOM,
} from "@/constants/canvas";
import { useSession, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { placePixelAction } from "@/actions"; // Import the server action
import { clampPosition } from "@/utils/canvas";

const defaultPixel: Pixel = {
  color: {
    r: 255,
    g: 255,
    b: 255,
  },
  placedBy: null,
};

const CanvasContext = createContext<CanvasContextState | undefined>(undefined);

export const CanvasProvider = ({ children }: { children: ReactNode }) => {
  const { user, isSignedIn } = useUser();
  const { session } = useSession();

  const [pixels, setPixels] = useState<Pixel[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPixel, setHoveredPixel] = useState<Coordinates | null>(null);
  const [selectedPixel, setSelectedPixel] = useState<Coordinates | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPlacedTimestamp, setLastPlacedTimestamp] = useState<number | null>(
    null
  );

  // Effect to load initial lastPlacedTimestamp from user metadata
  useEffect(() => {
    if (user?.publicMetadata?.lastPlaced) {
      const lastPlaced = user.publicMetadata.lastPlaced as number;
      // Initialize with the server timestamp, ensuring it's not in the future relative to client's clock
      setLastPlacedTimestamp(Math.min(lastPlaced, Date.now()));
    } else {
      setLastPlacedTimestamp(null);
    }
  }, [user]); // Re-run when the user object changes

  // Effect to initialize canvas position to the center of the screen
  useEffect(() => {
    const initialX =
      (window.innerWidth - CANVAS_WIDTH * DEFAULT_PIXEL_SIZE) / 2;
    const initialY =
      (window.innerHeight - CANVAS_HEIGHT * DEFAULT_PIXEL_SIZE) / 2;
    setPosition({ x: initialX, y: initialY });
  }, []); // Include zoom in the dependency array

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

  // Fetch the initial pixels
  useEffect(() => {
    const fetchInitialPixels = async () => {
      const { data, error } = await client
        .from(PIXELS_TABLE)
        .select("x, y, r, g, b, placed_by");

      if (error) {
        console.error("Error fetching pixels:", error);
        setIsLoading(false);
        return;
      }

      if (data) {
        const newPixels: Pixel[][] = Array(CANVAS_HEIGHT)
          .fill(null)
          .map(() => Array(CANVAS_WIDTH).fill({ ...defaultPixel }));

        data.forEach((pixel) => {
          if (
            pixel.y >= 0 &&
            pixel.y < CANVAS_HEIGHT &&
            pixel.x >= 0 &&
            pixel.x < CANVAS_WIDTH
          ) {
            newPixels[pixel.y][pixel.x] = {
              color: {
                r: pixel.r,
                g: pixel.g,
                b: pixel.b,
              },
              placedBy: pixel.placed_by,
            };
          }
        });
        setPixels(newPixels);
        setIsLoading(false);
      }
    };

    fetchInitialPixels();
  }, [client, isLoading]);

  // Subscribe to real-time changes
  useEffect(() => {
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

          if (eventType === "INSERT" || eventType === "UPDATE") {
            setPixels((prevPixels) => {
              const updatedPixels = prevPixels.map((row) => [...row]);
              if (
                newRecord.y >= 0 &&
                newRecord.y < CANVAS_HEIGHT &&
                newRecord.x >= 0 &&
                newRecord.x < CANVAS_WIDTH
              ) {
                updatedPixels[newRecord.y][newRecord.x] = {
                  color: {
                    r: newRecord.r,
                    g: newRecord.g,
                    b: newRecord.b,
                  },
                  placedBy: newRecord.placed_by,
                };
              }
              return updatedPixels;
            });
          } else if (eventType === "DELETE") {
            setPixels((prevPixels) => {
              const updatedPixels = prevPixels.map((row) => [...row]);
              if (
                oldRecord.y >= 0 &&
                oldRecord.y < CANVAS_HEIGHT &&
                oldRecord.x >= 0 &&
                oldRecord.x < CANVAS_WIDTH
              ) {
                updatedPixels[oldRecord.y][oldRecord.x] = { ...defaultPixel };
              }
              return updatedPixels;
            });
          }
        }
      )
      .subscribe();

    // Cleanup function to remove the channel subscription when the component unmounts
    return () => {
      client.removeChannel(channel);
    };
  }, [client]); // Added session to dependencies

  const setClampedPosition = useCallback(
    (
      newPosValueOrFn: Coordinates | ((prevPos: Coordinates) => Coordinates)
    ) => {
      setPosition((currentActualPosition) => {
        const newUnclampedPos =
          typeof newPosValueOrFn === "function"
            ? newPosValueOrFn(currentActualPosition)
            : newPosValueOrFn;
        return clampPosition(newUnclampedPos, zoom, pixels, DEFAULT_PIXEL_SIZE);
      });
    },
    [pixels, zoom] // Depends only on the stable setPosition from context
  );

  const adjustZoom = (
    multFactor: number,
    anchor?: { x: number; y: number }
  ) => {
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * multFactor));
    setZoom(newZoom);

    if (!anchor) {
      anchor = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };
    }

    const newPositionX = anchor.x - (anchor.x - position.x) * (newZoom / zoom);
    const newPositionY = anchor.y - (anchor.y - position.y) * (newZoom / zoom);
    setClampedPosition({ x: newPositionX, y: newPositionY });
  };

  const placePixel = async () => {
    if (isLoading) {
      console.error("Loading pixels, please wait.");
      return;
    }

    if (!isSignedIn || !user) {
      console.error("User must be signed in to place a pixel");
      return;
    }

    if (selectedPixel) {
      const originalPixels = pixels;
      const originalTimestamp = lastPlacedTimestamp;
      const newPixels = pixels.map((row, y) =>
        row.map((pixel, x) => {
          if (x === selectedPixel.x && y === selectedPixel.y) {
            return { ...pixel, color: selectedColor, placedBy: user.id };
          }
          return pixel;
        })
      );
      setPixels(newPixels);
      setLastPlacedTimestamp(Date.now()); // Optimistically update the timestamp

      // Call server action
      const result = await placePixelAction(selectedPixel, selectedColor);

      if (!result.success) {
        console.error("Error updating pixel:", result.error);
        setPixels(originalPixels); // Revert optimistic pixel update
        setLastPlacedTimestamp(originalTimestamp); // Revert optimistic timestamp
      }
    }
  };

  const contextValue = {
    isSignedIn,
    pixels,
    setPixels,
    hoveredPixel,
    setHoveredPixel,
    selectedPixel,
    setSelectedPixel,
    selectedColor,
    setSelectedColor,
    zoom,
    adjustZoom,
    position,
    setClampedPosition,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    placePixel,
    isLoading,
    lastPlacedTimestamp,
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
