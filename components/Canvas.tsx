"use client";

import type React from "react";
import { DEFAULT_PIXEL_SIZE, MIN_ZOOM, MAX_ZOOM } from "@/constants/canvas";

import { useRef, useEffect, useCallback } from "react";
import { useCanvas } from "@/contexts/CanvasContext";

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pendingDragStartInfoRef = useRef<{
    clientX: number;
    clientY: number;
  } | null>(null);

  // Use context values
  const {
    pixels,
    zoom,
    setZoom,
    position,
    setPosition,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
  } = useCanvas();

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
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
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
      // Store initial mouse position but don't start dragging yet
      pendingDragStartInfoRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
      };
    }
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (pendingDragStartInfoRef.current) {
      // Mouse has moved after mousedown, so start the drag
      setIsDragging(true);
      const newDragStartX =
        pendingDragStartInfoRef.current.clientX - position.x;
      const newDragStartY =
        pendingDragStartInfoRef.current.clientY - position.y;
      setDragStart({ x: newDragStartX, y: newDragStartY });

      // Update position based on the new drag start
      setPosition({
        x: e.clientX - newDragStartX,
        y: e.clientY - newDragStartY,
      });

      pendingDragStartInfoRef.current = null; // Drag has started, clear the pending info
    } else if (isDragging) {
      // Drag was already in progress
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
    pendingDragStartInfoRef.current = null; // Clear pending drag info
  };

  // Handle mouse leave to stop dragging
  const handleMouseLeave = () => {
    setIsDragging(false);
    pendingDragStartInfoRef.current = null; // Clear pending drag info
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

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 ${
        isDragging ? "cursor-grabbing" : "cursor-crosshair"
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    />
  );
}
