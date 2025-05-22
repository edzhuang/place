export const PIXELS_TABLE = "pixels";
export const delay = 60000; // 1 minute cooldown for placing a pixel

// Default canvas size
export const CANVAS_WIDTH = 100;
export const CANVAS_HEIGHT = 100;
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
  { r: 255, g: 69, b: 0 }, // Red
  { r: 255, g: 168, b: 0 }, // Orange
  { r: 255, g: 214, b: 53 }, // Yellow
  { r: 0, g: 163, b: 104 }, // Green
  { r: 126, g: 237, b: 86 }, // Light Green
  { r: 36, g: 80, b: 164 }, // Blue
  { r: 54, g: 144, b: 234 }, // Light Blue
  { r: 81, g: 233, b: 244 }, // Cyan
  { r: 129, g: 30, b: 159 }, // Purple
  { r: 255, g: 153, b: 170 }, // Pink
  { r: 156, g: 105, b: 38 }, // Brown
  { r: 0, g: 0, b: 0 }, // Black
  { r: 137, g: 141, b: 144 }, // Gray
  { r: 212, g: 215, b: 217 }, // Light Gray
  { r: 255, g: 255, b: 255 }, // White
];
