import { Coordinates, Pixel } from "../types/canvas";
import { DEFAULT_PIXEL_SIZE } from "../constants/canvas";

// Helper function to clamp position (remains outside)
export const clampPosition = (
  pos: Coordinates,
  zoom: number,
  pixelsData: Pixel[][] | null,
  defaultPixelSize: number
): Coordinates => {
  if (
    !pixelsData ||
    pixelsData.length === 0 ||
    !pixelsData[0] ||
    pixelsData[0].length === 0
  ) {
    return pos;
  }
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const gridWidth = pixelsData[0].length;
  const gridHeight = pixelsData.length;
  const effectivePixelSize = defaultPixelSize * zoom;
  const contentWidth = gridWidth * effectivePixelSize;
  const contentHeight = gridHeight * effectivePixelSize;

  let clampedX = pos.x;
  let clampedY = pos.y;

  clampedX = Math.min(clampedX, viewportWidth / 2);
  clampedX = Math.max(clampedX, viewportWidth / 2 - contentWidth);
  clampedY = Math.min(clampedY, viewportHeight / 2);
  clampedY = Math.max(clampedY, viewportHeight / 2 - contentHeight);

  return { x: clampedX, y: clampedY };
};

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
