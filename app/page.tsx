import Image from "next/image";
import { Canvas } from "@/components/Canvas";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="w-full h-[calc(100vh-150px)] flex items-center justify-center">
        <Canvas />
      </div>
    </main>
  );
}
