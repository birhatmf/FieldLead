import path from "node:path";
import { config } from "dotenv";
import type { NextConfig } from "next";

config({ path: [path.resolve(process.cwd(), "../../.env"), ".env"] });

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
