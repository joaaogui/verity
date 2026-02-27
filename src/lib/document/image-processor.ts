import sharp from "sharp";

const MAX_WIDTH = 768;

export async function resizeImageForLLM(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
}
