import {
  Dialog,
  DialogBody,
  DialogDescription,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { VisuallyHidden } from "@/components/ui/_VisuallyHidden";
import Link from "next/link";

function AboutDialog({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>About</DialogTitle>
          <VisuallyHidden>
            <DialogDescription>Info about the project</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-y-3">
          <p>
            This is a recreation of Reddit&apos;s{" "}
            <Link
              className="text-muted-foreground hover:text-foreground hover:[&>code]:text-foreground underline underline-offset-[5px] transition-colors"
              href="https://en.wikipedia.org/wiki/R%2Fplace"
            >
              r/place
            </Link>{" "}
            - a collaborative digital canvas where users can place colored
            pixels to create art together.
          </p>
          <p>
            You must be signed in to place pixels. After placing a pixel, there
            is a cooldown period of one minute.
          </p>
          <p>
            Built with Next.js, TypeScript, Clerk, and Supabase for real-time
            collaboration.
          </p>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export { AboutDialog };
