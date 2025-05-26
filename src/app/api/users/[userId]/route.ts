import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    const { userId } = await context.params;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const client = await clerkClient(); // Call clerkClient to get the actual client
    const user = await client.users.getUser(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prefer username, fallback to first name, then to a generic placeholder
    const displayName =
      user.username || user.firstName || `User ${userId.substring(0, 5)}`;

    return NextResponse.json({ username: displayName }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    // Check if the error is a Clerk specific error for user not found
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status?: unknown }).status === 404
    ) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
