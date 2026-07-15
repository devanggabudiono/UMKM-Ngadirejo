import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // All images are local (public/images/), no remote patterns needed
    formats: ["image/webp"],
  },
};

export default nextConfig;
