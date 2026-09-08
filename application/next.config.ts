import type { NextConfig } from "next";
import path from "node:path";
import fs from "node:fs";

// Load root .env
const rootEnvPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(rootEnvPath)) {
  const content = fs.readFileSync(rootEnvPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID || "",
  },
};

export default nextConfig;
