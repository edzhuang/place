import { Coordinates, Pixel } from "../types/canvas";
import { DEFAULT_PIXEL_SIZE } from "../constants/canvas";

export const calculateGridCoordinates = (
  clientX: number,
  clientY: number,
  rect: DOMRect,
  position: Coordinates,
  zoom: number
): { gridX: number; gridY: number } => {
  const effectivePixelSize = DEFAULT_PIXEL_SIZE * zoom;
  const x = (clientX - rect.left - position.x) / effectivePixelSize;
  const y = (clientY - rect.top - position.y) / effectivePixelSize;
  return { gridX: Math.floor(x), gridY: Math.floor(y) };
};

export const isPixelInBounds = (
  x: number,
  y: number,
  pixels: Pixel[][] | null
): boolean => {
  if (!pixels || pixels.length === 0 || !pixels[0] || pixels[0].length === 0) {
    return false;
  }
  return x >= 0 && x < pixels[0].length && y >= 0 && y < pixels.length;
};
