import type { NextConfig } from "next";
import path from "path";

const repo = "switchon-tracker";
const isPages = process.env.GITHUB_PAGES === "1";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: isPages ? `/${repo}` : undefined,
  assetPrefix: isPages ? `/${repo}/` : undefined,
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
