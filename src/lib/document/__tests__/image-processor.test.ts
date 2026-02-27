import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { resizeImageForLLM } from "../image-processor";

describe("resizeImageForLLM", () => {
  it("resizes a large image to max 768px width as JPEG", async () => {
    const largeImage = await sharp({
      create: { width: 2048, height: 3000, channels: 3, background: "white" },
    })
      .png()
      .toBuffer();

    const result = await resizeImageForLLM(largeImage);
    const metadata = await sharp(result).metadata();

    expect(metadata.width).toBeLessThanOrEqual(768);
    expect(metadata.format).toBe("jpeg");
  });

  it("does not upscale a small image", async () => {
    const smallImage = await sharp({
      create: { width: 500, height: 700, channels: 3, background: "white" },
    })
      .png()
      .toBuffer();

    const result = await resizeImageForLLM(smallImage);
    const metadata = await sharp(result).metadata();

    expect(metadata.width).toBe(500);
  });
});
