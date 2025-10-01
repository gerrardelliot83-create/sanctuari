import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Create route handler with token authentication
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
  },
});
