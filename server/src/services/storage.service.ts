import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../uploads");
const avatarsDir = path.join(root, "avatars");

let s3Client: S3Client | null = null;
if (env.awsAccessKeyId && env.awsSecretAccessKey && env.awsS3Bucket) {
  s3Client = new S3Client({
    region: env.awsRegion,
    credentials: {
      accessKeyId: env.awsAccessKeyId,
      secretAccessKey: env.awsSecretAccessKey,
    },
  });
}

export function ensureUploadDir() {
  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(avatarsDir, { recursive: true });
}

export async function saveFile(filename: string, buffer: Buffer, mimeType: string, folder = "properties"): Promise<string> {
  // If AWS S3 is configured, upload to S3
  if (s3Client && env.awsS3Bucket) {
    const key = `${folder}/${filename}`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.awsS3Bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    return `https://${env.awsS3Bucket}.s3.${env.awsRegion}.amazonaws.com/${key}`;
  }

  // Local fallback
  ensureUploadDir();
  const targetDir = folder === "avatars" ? avatarsDir : root;
  const dest = path.join(targetDir, filename);
  fs.writeFileSync(dest, buffer);
  return folder === "avatars" ? `/uploads/avatars/${filename}` : `/uploads/${filename}`;
}

export function saveLocalFile(filename: string, buffer: Buffer) {
  ensureUploadDir();
  const dest = path.join(root, filename);
  fs.writeFileSync(dest, buffer);
  return `/uploads/${filename}`;
}

export function deleteLocalFile(publicPath: string) {
  if (publicPath.startsWith("http://") || publicPath.startsWith("https://")) {
    // S3 or external URL
    return;
  }
  const name = path.basename(publicPath);
  const dest = publicPath.includes("/avatars/") ? path.join(avatarsDir, name) : path.join(root, name);
  if (fs.existsSync(dest)) fs.unlinkSync(dest);
}

export function defaultImageForType(type: string) {
  const map: Record<string, string> = {
    APARTMENT: "/defaults/apartment.svg",
    VILLA: "/defaults/villa.svg",
    INDEPENDENT_HOUSE: "/defaults/house.svg",
    PLOT: "/defaults/plot.svg",
    BUILDER_FLOOR: "/defaults/apartment.svg",
  };
  return map[type] ?? "/defaults/apartment.svg";
}

export const uploadRoot = root;
