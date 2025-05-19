import { COLORS } from "@/constants/canvas";
import { useCanvas } from "@/contexts/CanvasContext";
import clsx from "clsx";

export function Palette() {
  // Use context values
  const { selectedColor, setSelectedColor } = useCanvas();

  return (
    <div className="flex flex-wrap gap-1">
      {COLORS.map((color) => (
        <button
          key={color}
          className={clsx("w-8 h-8 rounded-md border", {
            "outline outline-primary": selectedColor === color,
          })}
          style={{ backgroundColor: color }}
          onClick={() => setSelectedColor(color)}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  );
}
