import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Log token status (first 10 chars only for security)
const token = process.env.UPLOADTHING_TOKEN;
if (!token) {
  console.error("[UploadThing] UPLOADTHING_TOKEN not found in environment variables");
} else {
  console.log("[UploadThing] Token configured:", token.substring(0, 10) + "...");
}

// Create route handler with explicit token configuration
// UploadThing requires either UPLOADTHING_TOKEN env var or explicit config
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    token: token,
  },
});
