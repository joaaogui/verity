import type { NextConfig } from "next";
import { execSync } from "child_process";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["sharp"],
  env: {
    NEXT_PUBLIC_APP_VERSION: (() => {
      try {
        return execSync("git describe --tags --abbrev=0").toString().trim();
      } catch {
        return "dev";
      }
    })(),
  },
};

export default nextConfig;
