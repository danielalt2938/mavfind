import { getFirebaseStorage } from "./admin";
import { v4 as uuidv4 } from "uuid";

export async function uploadImage(
  file: File,
  folder: "requests" | "lost"
): Promise<string> {
  const storage = getFirebaseStorage();
  const bucket = storage.bucket();

  const fileName = `${folder}/${uuidv4()}-${file.name}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const fileUpload = bucket.file(fileName);

  await fileUpload.save(fileBuffer, {
    metadata: {
      contentType: file.type,
    },
  });

  // Make the file publicly accessible
  await fileUpload.makePublic();

  // Return the public URL
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}

export async function uploadMultipleImages(
  files: File[],
  folder: "requests" | "lost"
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadImage(file, folder));
  return Promise.all(uploadPromises);
}

export async function getSignedUrl(
  filePath: string,
  expiresIn: number = 3600000
): Promise<string> {
  const storage = getFirebaseStorage();
  const bucket = storage.bucket();
  const file = bucket.file(filePath);

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + expiresIn, // 1 hour default
  });

  return url;
}

export async function deleteImage(filePath: string): Promise<void> {
  const storage = getFirebaseStorage();
  const bucket = storage.bucket();
  await bucket.file(filePath).delete();
}
