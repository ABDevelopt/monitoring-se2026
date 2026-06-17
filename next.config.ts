import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Diperlukan untuk deployment di shared hosting (cPanel/Dewaweb)
  // Output standalone meng-copy semua dependency yang dibutuhkan tanpa mengandalkan symlink node_modules
  output: "standalone",
};

export default nextConfig;
