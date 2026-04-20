import type { NextConfig } from "next";
import path from "path";

const repo = "switchon-tracker";
const isPages = process.env.GITHUB_PAGES === "1";
const basePath = isPages ? `/${repo}` : "";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
