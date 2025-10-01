import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// UploadThing will automatically use UPLOADTHING_TOKEN from environment
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
