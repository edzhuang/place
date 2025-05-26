import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Standard matcher for pages, excluding static files and _next internals
    // Next.js will prepend the basePath to this pattern automatically for runtime.
    "/((?!_next|[^?]*\\\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Standard matcher for API routes
    // Next.js will prepend the basePath to this pattern automatically for runtime.
    "/(api|trpc)(.*)",
  ],
};
