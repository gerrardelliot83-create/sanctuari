import { createUploadthing } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getUser } from "@sanctuari/database/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  // Policy PDF uploader (authenticated)
  policyUploader: f({ pdf: { maxFileSize: "16MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      // Authenticate user
      const userData = await getUser();
      const user = userData?.user || userData;

      if (!user) {
        console.error("[UploadThing] No user found");
        throw new UploadThingError("Unauthorized");
      }

      console.log("[UploadThing] User authenticated:", user.id);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UploadThing] Policy uploaded:", {
        userId: metadata.userId,
        fileUrl: file.url,
        fileName: file.name,
        fileSize: file.size
      });

      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),

  // Quote document uploader (public - no authentication required)
  quoteUploader: f({ pdf: { maxFileSize: "16MB", maxFileCount: 5 } })
    .middleware(async ({ req }) => {
      // Public endpoint - no authentication required
      console.log("[UploadThing] Public quote upload");
      return { public: true };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UploadThing] Quote document uploaded:", {
        fileUrl: file.url,
        fileName: file.name,
        fileSize: file.size
      });

      return { fileUrl: file.url };
    }),

  // Policy wording uploader (public - no authentication required)
  policyWordingUploader: f({ pdf: { maxFileSize: "16MB", maxFileCount: 5 } })
    .middleware(async ({ req }) => {
      // Public endpoint - no authentication required
      console.log("[UploadThing] Public policy wording upload");
      return { public: true };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UploadThing] Policy wording uploaded:", {
        fileUrl: file.url,
        fileName: file.name,
        fileSize: file.size
      });

      return { fileUrl: file.url };
    }),
};
