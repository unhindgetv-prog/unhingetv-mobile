// One-shot: produce 640x920 IAP review screenshots from the paywall capture.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

await mkdir("iap-screenshots", { recursive: true });

const src = "screenshots/04-subscribe-iphone67.png";

await sharp(src)
  .resize(640, 920, { fit: "cover", position: "top" })
  .flatten({ background: "#000000" })
  .png({ compressionLevel: 9 })
  .toFile("iap-screenshots/monthly-review-640x920.png");

await sharp(src)
  .resize(640, 920, { fit: "cover", position: "top" })
  .flatten({ background: "#000000" })
  .png({ compressionLevel: 9 })
  .toFile("iap-screenshots/yearly-review-640x920.png");

console.log("done");
