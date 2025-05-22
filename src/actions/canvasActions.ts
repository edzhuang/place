"use server";

import { createServerSupabaseClient } from "@/utils/supabase/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server"; // Renamed import for clarity
import { PIXELS_TABLE } from "@/constants/canvas";
import type { Coordinates, Color } from "@/types/canvas";
import { cooldown } from "@/constants/canvas";

export async function placePixelAction(
  selectedPixel: Coordinates,
  selectedColor: Color
): Promise<{ success: boolean; error?: string | null }> {
  const authResult = await auth();
  const userId = authResult.userId;

  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }

  const user = await currentUser();
  const lastPlaced = user?.publicMetadata?.lastPlaced as number | undefined;
  const now: number = Date.now();

  if (lastPlaced && now - lastPlaced < cooldown) {
    return {
      success: false,
      error: `You can only place a pixel every ${cooldown / 1000} seconds.`,
    };
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { error: upsertError } = await supabase.from(PIXELS_TABLE).upsert(
      {
        x: selectedPixel.x,
        y: selectedPixel.y,
        r: selectedColor.r,
        g: selectedColor.g,
        b: selectedColor.b,
        placed_by: userId,
      },
      { onConflict: "x,y" }
    );

    if (upsertError) {
      console.error("Supabase upsert error in server action:", upsertError);
      return { success: false, error: upsertError.message };
    }

    // Pixel placed successfully, now update Clerk user metadata
    try {
      const clerk = await clerkClient(); // Await the client itself
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          ...(user?.publicMetadata || {}), // Preserve other metadata
          lastPlaced: now,
        },
      });
    } catch (clerkError) {
      console.error("Error updating Clerk user metadata:", clerkError);
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Error in placePixelAction:", error);
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while placing the pixel.";
    return { success: false, error: message };
  }
}
