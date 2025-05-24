import { Coordinates, Pixel } from "../types/canvas";

export const calculateGridCoordinates = (
  clientX: number,
  clientY: number,
  rect: DOMRect,
  position: Coordinates,
  zoom: number
): Coordinates => {
  const x = (clientX - rect.left - position.x) / zoom;
  const y = (clientY - rect.top - position.y) / zoom;
  return { x: Math.floor(x), y: Math.floor(y) };
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
