import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Check ALL UploadThing environment variables
console.log("[UploadThing] Environment check:");
console.log("  - UPLOADTHING_TOKEN:", process.env.UPLOADTHING_TOKEN ? "✓ Set" : "✗ Missing");
console.log("  - UPLOADTHING_SECRET:", process.env.UPLOADTHING_SECRET ? "✓ Set" : "✗ Missing");
console.log("  - UPLOADTHING_APP_ID:", process.env.UPLOADTHING_APP_ID ? "✓ Set" : "✗ Missing");

// Create route handler
// UploadThing v7+ uses UPLOADTHING_TOKEN, older versions use UPLOADTHING_SECRET
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    // Try token first (v7+), fallback to secret (older versions)
    token: process.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_SECRET,
    logLevel: "Debug",
  },
});
