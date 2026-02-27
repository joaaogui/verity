import sharp from "sharp";

const MAX_WIDTH = 1024;

export async function resizeImageForLLM(imageBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();

  if (metadata.width && metadata.width > MAX_WIDTH) {
    return sharp(imageBuffer)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .png()
      .toBuffer();
  }

  return sharp(imageBuffer).png().toBuffer();
}
