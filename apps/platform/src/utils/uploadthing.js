import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";

// Generate typed components for the file router
// These will use the file router defined in /api/uploadthing/core.js
export const UploadButton = generateUploadButton({
  url: "/api/uploadthing",
});
export const UploadDropzone = generateUploadDropzone({
  url: "/api/uploadthing",
});
