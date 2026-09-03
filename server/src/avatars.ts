import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const avatarsDir = path.resolve(
  process.env.AVATARS_DIR ?? path.join(process.cwd(), "avatars"),
);

function sniffExtension(buffer: Buffer): string {
  if (
    buffer.length > 3 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }

  if (buffer.length > 3 && buffer[0] === 0x47 && buffer[1] === 0x49) {
    return "gif";
  }

  if (
    buffer.length > 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }

  return "jpg";
}

export async function cacheAvatar(
  plexId: number,
  thumbUrl: string | null | undefined,
): Promise<string | null> {
  if (!thumbUrl || !/^https?:\/\//i.test(thumbUrl)) {
    return null;
  }

  try {
    const response = await fetch(thumbUrl);

    if (!response.ok) {
      console.warn(
        `Avatar download failed (${response.status}) for user ${plexId}`,
      );
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const extension = sniffExtension(buffer);

    await mkdir(avatarsDir, { recursive: true });
    await writeFile(path.join(avatarsDir, `${plexId}.${extension}`), buffer);

    return `/api/avatars/${plexId}.${extension}`;
  } catch (error) {
    console.warn(
      `Avatar caching failed for user ${plexId}:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export function avatarsDirPath(): string {
  return avatarsDir;
}
