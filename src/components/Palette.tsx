import { COLORS } from "@/constants/canvas";
import { useCanvas } from "@/contexts/CanvasContext";
import clsx from "clsx";

export function Palette() {
  const { selectedColor, setSelectedColor } = useCanvas();

  return (
    <div className="flex flex-wrap gap-1">
      {COLORS.map((color) => (
        <button
          key={`${color.r}, ${color.g}, ${color.b}`}
          className={clsx("w-8 h-8 rounded-md border", {
            "outline outline-primary": selectedColor === color,
          })}
          style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
          onClick={() => setSelectedColor(color)}
          aria-label={`Select color rgb(${color.r}, ${color.g}, ${color.b})`}
        />
      ))}
    </div>
  );
}
