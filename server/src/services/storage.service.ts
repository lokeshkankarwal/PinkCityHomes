import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../uploads");
const avatarsDir = path.join(root, "avatars");

// Configure Cloudinary if credentials are provided
const hasCloudinary = Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);
if (hasCloudinary) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
}

// Configure AWS S3 if credentials are provided
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

export async function saveFile(
  filename: string,
  buffer: Buffer,
  mimeType: string,
  folder = "properties",
): Promise<string> {
  // 1. Primary: Cloudinary Media Storage
  if (hasCloudinary) {
    return new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `pinkcityhomes/${folder}`,
          resource_type: "auto",
        },
        (error, result) => {
          if (error || !result) {
            console.error("[Cloudinary] Upload stream error:", error);
            reject(error || new Error("Cloudinary upload failed"));
          } else {
            resolve(result.secure_url);
          }
        },
      );
      uploadStream.end(buffer);
    });
  }

  // 2. Secondary: AWS S3
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

  // 3. Fallback: Local Storage
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

export async function deleteLocalFile(publicPath: string): Promise<void> {
  if (!publicPath) return;

  // Cloudinary media
  if (publicPath.includes("res.cloudinary.com")) {
    try {
      const regex = /\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/;
      const match = publicPath.match(regex);
      if (match && match[1]) {
        await cloudinary.uploader.destroy(match[1]);
      }
    } catch (e) {
      console.warn("[Storage] Cloudinary delete failed:", (e as Error).message);
    }
    return;
  }

  // S3 or external URL
  if (publicPath.startsWith("http://") || publicPath.startsWith("https://")) {
    if (s3Client && env.awsS3Bucket) {
      try {
        const url = new URL(publicPath);
        const key = url.pathname.replace(/^\//, "");
        await s3Client.send(new DeleteObjectCommand({ Bucket: env.awsS3Bucket, Key: key }));
      } catch (e) {
        console.warn("[Storage] S3 delete failed:", (e as Error).message);
      }
    }
    return;
  }

  // Local filesystem
  try {
    const name = path.basename(publicPath);
    const dest = publicPath.includes("/avatars/") ? path.join(avatarsDir, name) : path.join(root, name);
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
  } catch (e) {
    console.warn("[Storage] Local file deletion failed:", (e as Error).message);
  }
}

export const deleteFile = deleteLocalFile;

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
