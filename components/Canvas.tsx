"use client";

import type React from "react";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DEFAULT_PIXEL_SIZE,
  MIN_ZOOM,
  MAX_ZOOM,
} from "@/constants/canvas";

import { useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { ZoomIn, ZoomOut, Move } from "lucide-react";
import { Palette } from "@/components/Palette";
import { useCanvas } from "@/contexts/CanvasContext"; // Import the context

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use context values
  const {
    pixels,
    setPixels,
    selectedColor,
    setSelectedColor, // Make sure Palette uses this
    zoom,
    setZoom,
    position,
    setPosition,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
  } = useCanvas();

  // Initialize the canvas with empty pixels - This is now handled by the CanvasProvider in CanvasContext.tsx
  // useEffect(() => {
  //   const initialPixels = Array(CANVAS_HEIGHT)
  //     .fill(null)
  //     .map(() => Array(CANVAS_WIDTH).fill("#FFFFFF"));
  //   setPixels(initialPixels);
  // }, []); // Removed setPixels from dependency array as it's stable

  // Draw the canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || pixels.length === 0) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate pixel size based on zoom
    const pixelSize = DEFAULT_PIXEL_SIZE * zoom;

    // Draw pixels
    for (let y = 0; y < pixels.length; y++) {
      for (let x = 0; x < pixels[y].length; x++) {
        const pixelX = x * pixelSize + position.x;
        const pixelY = y * pixelSize + position.y;

        // Only draw pixels that are visible in the viewport
        if (
          pixelX + pixelSize >= 0 &&
          pixelX <= canvas.width &&
          pixelY + pixelSize >= 0 &&
          pixelY <= canvas.height
        ) {
          ctx.fillStyle = pixels[y][x];
          ctx.fillRect(pixelX, pixelY, pixelSize, pixelSize);
        }
      }
    }
  }, [pixels, zoom, position]);

  // Update canvas when pixels, zoom, or position changes
  useEffect(() => {
    drawCanvas();
  }, [pixels, zoom, position, drawCanvas]);

  // Resize canvas when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        drawCanvas();
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawCanvas]);

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left click
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle mouse leave to stop dragging
  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Handle canvas click to place a pixel
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isDragging) return; // Don\\'t place pixels while dragging

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Calculate the pixel coordinates based on zoom and position
    const pixelSize = DEFAULT_PIXEL_SIZE * zoom;
    const pixelX = Math.floor((clickX - position.x) / pixelSize);
    const pixelY = Math.floor((clickY - position.y) / pixelSize);

    // Check if the pixel is within bounds
    if (
      pixelX >= 0 &&
      pixelX < CANVAS_WIDTH &&
      pixelY >= 0 &&
      pixelY < CANVAS_HEIGHT
    ) {
      // Update the pixel
      setPixels((prevPixels) => {
        const newPixels = prevPixels.map((row, rIdx) => {
          if (rIdx === pixelY) {
            return row.map((col, cIdx) =>
              cIdx === pixelX ? selectedColor : col
            );
          }
          return row;
        });
        return newPixels;
      });
    }
  };

  // Handle wheel event for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newPositionX = mouseX - (mouseX - position.x) * (newZoom / zoom);
    const newPositionY = mouseY - (mouseY - position.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPosition({ x: newPositionX, y: newPositionY });
  };

  // Handle zoom buttons
  const handleZoomIn = () => {
    const newZoom = Math.min(MAX_ZOOM, zoom + 0.5);
    // Adjust position to zoom towards center of canvas view if not mouse-based
    const canvas = canvasRef.current;
    if (!canvas) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const newPositionX = centerX - (centerX - position.x) * (newZoom / zoom);
    const newPositionY = centerY - (centerY - position.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPosition({ x: newPositionX, y: newPositionY });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(MIN_ZOOM, zoom - 0.5);
    // Adjust position to zoom towards center of canvas view
    const canvas = canvasRef.current;
    if (!canvas) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const newPositionX = centerX - (centerX - position.x) * (newZoom / zoom);
    const newPositionY = centerY - (centerY - position.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPosition({ x: newPositionX, y: newPositionY });
  };

  // Reset view
  const handleResetView = () => {
    setZoom(1);
    // Recenter based on initial canvas setup or a defined default
    // For simplicity, resetting to 0,0 or center of initial pixel data
    const initialX =
      (containerRef.current?.clientWidth || 0) / 2 -
      (CANVAS_WIDTH * DEFAULT_PIXEL_SIZE) / 2;
    const initialY =
      (containerRef.current?.clientHeight || 0) / 2 -
      (CANVAS_HEIGHT * DEFAULT_PIXEL_SIZE) / 2;
    setPosition({ x: initialX, y: initialY });
  };

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden border border-gray-300 rounded-lg bg-gray-50"
        onMouseUp={handleMouseUp} // Moved from canvas to container to catch mouse up outside canvas
        onMouseLeave={handleMouseLeave} // Moved from canvas to container
      >
        <canvas
          ref={canvasRef}
          className={`absolute ${
            isDragging ? "cursor-grabbing" : "cursor-crosshair"
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          // onMouseUp={handleMouseUp} // Moved to container
          // onMouseLeave={handleMouseLeave} // Moved to container
          onClick={handleCanvasClick}
          onWheel={handleWheel}
        />
      </div>
      <div className="flex items-center justify-center gap-2 p-2 rounded-lg shadow">
        <Palette
          // Pass selectedColor and setSelectedColor from context
          // Assuming PaletteProps are { selectedColor: string, setSelectedColor: (color: string) => void, colors: string[] }
          // If Palette is also refactored to use useCanvas(), these props might not be needed.
          // For now, we pass them.
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          // colors={COLORS} // COLORS would need to be imported or passed from context if Palette expects it
        />
        <Button
          onClick={handleZoomIn}
          aria-label="Zoom In"
          variant="outline"
          size="icon"
        >
          <ZoomIn className="w-5 h-5" />
        </Button>
        <Slider
          value={[zoom]}
          onValueChange={(value) => {
            const newZoom = value[0];
            // Adjust position to zoom towards center of canvas view
            const canvas = canvasRef.current;
            if (!canvas) return;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const newPositionX =
              centerX - (centerX - position.x) * (newZoom / zoom);
            const newPositionY =
              centerY - (centerY - position.y) * (newZoom / zoom);

            setZoom(newZoom);
            setPosition({ x: newPositionX, y: newPositionY });
          }}
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          className="w-32"
          aria-label="Zoom slider"
        />
        <Button
          onClick={handleZoomOut}
          aria-label="Zoom Out"
          variant="outline"
          size="icon"
        >
          <ZoomOut className="w-5 h-5" />
        </Button>
        <Button
          onClick={handleResetView}
          aria-label="Reset View"
          variant="outline"
        >
          <Move className="w-5 h-5 mr-2" /> Reset View
        </Button>
      </div>
    </div>
  );
}
