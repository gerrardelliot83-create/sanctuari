import { createUploadthing } from "uploadthing/next";
import { getUser } from "@sanctuari/database/lib/auth";

const f = createUploadthing({
  errorFormatter: (err) => {
    console.error("[UploadThing] Error:", err);
    return {
      message: err.message,
      code: err.code,
    };
  },
});

export const ourFileRouter = {
  // Policy PDF uploader
  policyUploader: f({ pdf: { maxFileSize: "16MB", maxFileCount: 1 } })
    .middleware(async () => {
      // Authenticate user
      const { user } = await getUser();
      if (!user) throw new Error("Unauthorized");

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
};
