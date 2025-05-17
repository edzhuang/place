"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { ZoomIn, ZoomOut, Move } from "lucide-react";

// Default canvas size
const CANVAS_WIDTH = 100;
const CANVAS_HEIGHT = 100;
const DEFAULT_PIXEL_SIZE = 10;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 20;

// Color palette
const COLORS = [
  "#FF4500", // Red
  "#FFA800", // Orange
  "#FFD635", // Yellow
  "#00A368", // Green
  "#7EED56", // Light Green
  "#2450A4", // Blue
  "#3690EA", // Light Blue
  "#51E9F4", // Cyan
  "#811E9F", // Purple
  "#FF99AA", // Pink
  "#9C6926", // Brown
  "#000000", // Black
  "#898D90", // Gray
  "#D4D7D9", // Light Gray
  "#FFFFFF", // White
];

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pixels, setPixels] = useState<string[][]>([]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Initialize the canvas with empty pixels
  useEffect(() => {
    const initialPixels = Array(CANVAS_HEIGHT)
      .fill(null)
      .map(() => Array(CANVAS_WIDTH).fill("#FFFFFF"));
    setPixels(initialPixels);
  }, []);

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
    if (isDragging) return; // Don't place pixels while dragging

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate the pixel coordinates based on zoom and position
    const pixelSize = DEFAULT_PIXEL_SIZE * zoom;
    const pixelX = Math.floor((x - position.x) / pixelSize);
    const pixelY = Math.floor((y - position.y) / pixelSize);

    // Check if the pixel is within bounds
    if (
      pixelX >= 0 &&
      pixelX < CANVAS_WIDTH &&
      pixelY >= 0 &&
      pixelY < CANVAS_HEIGHT
    ) {
      // Update the pixel
      setPixels((prevPixels) => {
        const newPixels = [...prevPixels];
        newPixels[pixelY] = [...newPixels[pixelY]];
        newPixels[pixelY][pixelX] = selectedColor;
        return newPixels;
      });
    }
  };

  // Handle wheel event for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));

    // Calculate zoom center point (mouse position)
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate new position to zoom toward mouse pointer
    const newPosition = {
      x: mouseX - (mouseX - position.x) * (newZoom / zoom),
      y: mouseY - (mouseY - position.y) * (newZoom / zoom),
    };

    setZoom(newZoom);
    setPosition(newPosition);
  };

  // Handle zoom buttons
  const handleZoomIn = () => {
    const newZoom = Math.min(MAX_ZOOM, zoom + 0.5);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(MIN_ZOOM, zoom - 0.5);
    setZoom(newZoom);
  };

  // Reset view
  const handleResetView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-gray-100 rounded-lg">
        <div className="flex flex-wrap gap-1">
          {COLORS.map((color) => (
            <button
              key={color}
              className={`w-8 h-8 rounded-md border-2 ${
                selectedColor === color ? "border-black" : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <div className="w-32">
            <Slider
              value={[zoom]}
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
              aria-label="Zoom level"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={handleResetView}>
            <Move className="h-4 w-4 mr-2" />
            Reset View
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden border border-gray-300 rounded-lg bg-gray-50"
      >
        <canvas
          ref={canvasRef}
          className={`absolute ${
            isDragging ? "cursor-grabbing" : "cursor-crosshair"
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClick={handleCanvasClick}
          onWheel={handleWheel}
        />

        <div className="absolute bottom-2 right-2 bg-white bg-opacity-80 px-2 py-1 rounded text-xs">
          Zoom: {zoom.toFixed(1)}x
        </div>
      </div>
    </div>
  );
}
