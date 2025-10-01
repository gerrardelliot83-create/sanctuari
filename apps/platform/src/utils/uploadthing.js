import { generateReactHelpers } from "@uploadthing/react";

// Type definition for the file router
// This needs to match the server-side file router in api/uploadthing/core.js
export const { UploadButton, UploadDropzone, useUploadThing } =
  generateReactHelpers();
