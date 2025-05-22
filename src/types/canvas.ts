export type Color = {
  r: number;
  g: number;
  b: number;
};

export interface Pixel {
  color: Color;
  placedBy: string | null;
}

export type Coordinates = {
  x: number;
  y: number;
};

export interface CanvasContextState {
  pixels: Pixel[][];
  setPixels: React.Dispatch<React.SetStateAction<Pixel[][]>>;
  hoveredPixel: Coordinates | null;
  setHoveredPixel: React.Dispatch<React.SetStateAction<Coordinates | null>>;
  selectedPixel: Coordinates | null;
  setSelectedPixel: React.Dispatch<React.SetStateAction<Coordinates | null>>;
  selectedColor: Color;
  setSelectedColor: React.Dispatch<React.SetStateAction<Color>>;
  zoom: number;
  adjustZoom: (multFactor: number, anchor?: Coordinates) => void;
  position: Coordinates;
  setPosition: React.Dispatch<React.SetStateAction<Coordinates>>;
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  dragStart: Coordinates;
  setDragStart: React.Dispatch<React.SetStateAction<Coordinates>>;
  placePixel: () => void;
  isLoading: boolean;
}
