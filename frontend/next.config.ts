import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), ".."),
  transpilePackages: ["@viva-femini/shared"],
};

export default nextConfig;
