"use client";

import type React from "react";
import { useRef, useEffect, useCallback, useState } from "react"; // Added useState
import { DEFAULT_PIXEL_SIZE } from "@/constants/canvas";

interface OverlayCanvasProps {
  zoom: number;
  position: { x: number; y: number };
  pixels: string[][];
  selectedPixel: { x: number; y: number } | null;
  mouseEventArgsForHover: { clientX: number; clientY: number } | null; // ADDED
}

export function OverlayCanvas({
  zoom,
  position,
  pixels,
  selectedPixel,
  mouseEventArgsForHover, // ADDED
}: OverlayCanvasProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPixel, setHoveredPixel] = useState<{
    x: number;
    y: number;
  } | null>(null); // Internal state for hovered pixel

  // Effect to calculate hovered pixel based on mouse events
  useEffect(() => {
    if (!mouseEventArgsForHover) {
      if (hoveredPixel !== null) {
        // Clear hover if mouse events are null
        setHoveredPixel(null);
      }
      return;
    }

    if (
      !pixels ||
      pixels.length === 0 ||
      !pixels[0] ||
      pixels[0].length === 0
    ) {
      if (hoveredPixel !== null) {
        setHoveredPixel(null);
      }
      return;
    }

    const { clientX, clientY } = mouseEventArgsForHover;

    const effectivePixelSize = DEFAULT_PIXEL_SIZE * zoom;
    const gridX = Math.floor((clientX - position.x) / effectivePixelSize);
    const gridY = Math.floor((clientY - position.y) / effectivePixelSize);

    let newHoveredPixelTarget = null;
    if (
      gridY >= 0 &&
      gridY < pixels.length &&
      gridX >= 0 &&
      gridX < pixels[gridY].length
    ) {
      newHoveredPixelTarget = { x: gridX, y: gridY };
    }

    if (
      newHoveredPixelTarget?.x !== hoveredPixel?.x ||
      newHoveredPixelTarget?.y !== hoveredPixel?.y
    ) {
      setHoveredPixel(newHoveredPixelTarget);
    }
  }, [mouseEventArgsForHover, pixels, zoom, position, hoveredPixel]); // Added hoveredPixel to dependencies to avoid stale closure issues with setHoveredPixel(null) checks

  const drawOverlayCanvas = useCallback(() => {
    const overlay = overlayCanvasRef.current;
    const ctx = overlay?.getContext("2d");
    if (!overlay || !ctx) return;

    // Clear overlay canvas
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Draw hover outline
    if (
      hoveredPixel && // Use internal hoveredPixel state
      pixels.length > 0 &&
      pixels[0] &&
      pixels[0].length > 0
    ) {
      const { x: gridX, y: gridY } = hoveredPixel; // Use hoveredPixel

      if (
        gridY >= 0 &&
        gridY < pixels.length &&
        gridX >= 0 &&
        gridX < pixels[gridY].length
      ) {
        const effectivePixelSize = DEFAULT_PIXEL_SIZE * zoom;
        const drawSize = Math.round(effectivePixelSize);

        const outlineX = Math.round(gridX * effectivePixelSize + position.x);
        const outlineY = Math.round(gridY * effectivePixelSize + position.y);

        ctx.strokeStyle = "gray";
        ctx.lineWidth = 1;
        ctx.strokeRect(outlineX, outlineY, drawSize, drawSize);
      }
    }

    // Draw selected pixel outline
    if (
      selectedPixel &&
      pixels.length > 0 &&
      pixels[0] &&
      pixels[0].length > 0
    ) {
      const { x: gridX, y: gridY } = selectedPixel;

      if (
        gridY >= 0 &&
        gridY < pixels.length &&
        gridX >= 0 &&
        gridX < pixels[gridY].length
      ) {
        const effectivePixelSize = DEFAULT_PIXEL_SIZE * zoom;
        const drawSize = Math.ceil(effectivePixelSize);

        const outlineX = Math.round(gridX * effectivePixelSize + position.x);
        const outlineY = Math.round(gridY * effectivePixelSize + position.y);

        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.strokeRect(outlineX, outlineY, drawSize, drawSize);
      }
    }
  }, [pixels, zoom, position, selectedPixel, hoveredPixel]); // Depend on internal hoveredPixel

  useEffect(() => {
    drawOverlayCanvas();
  }, [zoom, position, pixels, selectedPixel, hoveredPixel, drawOverlayCanvas]); // Depend on internal hoveredPixel

  useEffect(() => {
    const handleResize = () => {
      if (overlayCanvasRef.current) {
        overlayCanvasRef.current.width = window.innerWidth;
        overlayCanvasRef.current.height = window.innerHeight;
        drawOverlayCanvas(); // Redraw after resize
      }
    };

    handleResize(); // Initial size
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawOverlayCanvas]);

  return (
    <canvas
      ref={overlayCanvasRef}
      className="fixed inset-0 pointer-events-none"
      // Width and height are set dynamically
    />
  );
}
