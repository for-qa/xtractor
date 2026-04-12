import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const SCHEDULE_TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Asia/Kolkata",
];

export function loadStaticAssets(root: string) {
  let logo = "";
  let smallLogo = "";
  let favIcon = "";

  try {
    // Prefer SVG (crisp at all sizes), fall back to PNG
    const svgPath = join(root, "assets", "logo.svg");
    const pngPath = join(root, "assets", "logo.svg");
    if (existsSync(svgPath)) {
      const buffer = readFileSync(svgPath);
      logo = `data:image/svg+xml;base64,${buffer.toString("base64")}`;
    } else if (existsSync(pngPath)) {
      const buffer = readFileSync(pngPath);
      logo = `data:image/png;base64,${buffer.toString("base64")}`;
    }

    const svgSmallPath = join(root, "assets", "logo-small.svg");
    const pngSmallPath = join(root, "assets", "logo-small.png");
    if (existsSync(svgSmallPath)) {
      const buffer = readFileSync(svgSmallPath);
      smallLogo = `data:image/svg+xml;base64,${buffer.toString("base64")}`;
    } else if (existsSync(pngSmallPath)) {
      const buffer = readFileSync(pngSmallPath);
      smallLogo = `data:image/png;base64,${buffer.toString("base64")}`;
    }
  } catch (_) {}

  favIcon = smallLogo;

  return { logo, smallLogo, favIcon };
}




