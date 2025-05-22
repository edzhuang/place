"use server";

import { createServerSupabaseClient } from "@/utils/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { PIXELS_TABLE } from "@/constants/canvas";
import type { Coordinates, Color } from "@/types/canvas";

export async function placePixelAction(
  selectedPixel: Coordinates,
  selectedColor: Color
): Promise<{ success: boolean; error?: string | null }> {
  const authResult = await auth(); // Await the auth() call
  const userId = authResult.userId;

  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }

  if (!selectedPixel) {
    return { success: false, error: "No pixel selected." };
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Modify the Supabase query to separate upsert and select
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

    // If upsert was successful, return success.
    // The actual data will be synced via real-time subscriptions.
    return { success: true }; // data is no longer returned from here
  } catch (error: unknown) {
    // Changed error type to unknown
    console.error("Error in placePixelAction:", error);
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while placing the pixel.";
    return { success: false, error: message };
  }
}
