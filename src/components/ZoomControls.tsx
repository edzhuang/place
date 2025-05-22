import { Button } from "@/components/ui/Button";
import { Plus, Minus } from "lucide-react";
import { useCanvas } from "@/contexts/CanvasContext";

export function ZoomControls() {
  const { adjustZoom } = useCanvas();

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="md"
        subject="icon"
        onClick={() => adjustZoom(1.1)}
        className="pointer-events-auto"
      >
        <Plus />
      </Button>
      <Button
        variant="outline"
        size="md"
        subject="icon"
        onClick={() => adjustZoom(0.9)}
        className="pointer-events-auto"
      >
        <Minus />
      </Button>
    </div>
  );
}
