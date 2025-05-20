// Default canvas size
export const CANVAS_WIDTH = 64;
export const CANVAS_HEIGHT = 64;
export const DEFAULT_PIXEL_SIZE = 10;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 20;

// Constants for momentum
export const DAMPING_FACTOR = 0.92; // How quickly the momentum slows down (0 to 1)
export const MIN_VELOCITY_THRESHOLD = 0.1; // Below this speed, momentum stops
export const KEY_ACCELERATION = 1; // How much velocity increases per frame when a key is held
export const MAX_KEY_VELOCITY = 15; // Maximum velocity achievable with keys

// Color palette
export const COLORS = [
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
