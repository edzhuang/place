// Default canvas size
export const CANVAS_WIDTH = 100;
export const CANVAS_HEIGHT = 100;
export const DEFAULT_PIXEL_SIZE = 10;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 20;

// Constants for momentum
export const DAMPING_FACTOR = 0.92; // How quickly the momentum slows down (0 to 1)
export const MIN_VELOCITY_THRESHOLD = 0.1; // Below this speed, momentum stops
export const KEY_ACCELERATION = 1; // How much velocity increases per frame when a key is held
export const MAX_KEY_VELOCITY = 15; // Maximum velocity achievable with keys

// Color palette
export const COLORS = [
  "#ff4500", // Red
  "#ffa800", // Orange
  "#ffd635", // Yellow
  "#00a368", // Green
  "#7eed56", // Light Green
  "#2450a4", // Blue
  "#3690ea", // Light Blue
  "#51e9f4", // Cyan
  "#811e9f", // Purple
  "#ff99aa", // Pink
  "#9c6926", // Brown
  "#000000", // Black
  "#898d90", // Gray
  "#d4d7d9", // Light Gray
  "#ffffff", // White
];
