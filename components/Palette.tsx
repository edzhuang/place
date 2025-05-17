import { COLORS } from "@/constants/canvas";

interface PaletteProps {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
}

export function Palette({ selectedColor, setSelectedColor }: PaletteProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {COLORS.map((color) => (
        <button
          key={color}
          className={`w-8 h-8 rounded-md border-2 ${
            selectedColor === color
              ? "outline-2 outline-white border-black"
              : "border-transparent"
          }`}
          style={{ backgroundColor: color }}
          onClick={() => setSelectedColor(color)}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  );
}
