import { Palette } from "@/components/Palette";
import { Button } from "@/components/ui/Button";

export function Drawer() {
  return (
    <div className="w-full flex flex-col bg-background gap-4 px-8 py-4 items-center border-t">
      <Palette />
      <div className="flex flex-row gap-2">
        <Button variant="outline" size="md">
          Cancel
        </Button>
        <Button variant="primary" size="md">
          Place
        </Button>
      </div>
    </div>
  );
}
