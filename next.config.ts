import type { NextConfig } from "next";
import path from "path";

const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3007/api";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "socket.io-client",
    "engine.io-client",
    "@socket.io/component-emitter",
    "@react-oauth/google",
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias["react-router-dom"] = path.resolve(
      __dirname,
      "src/presentation/lib/react-router-compat.tsx"
    );
    return config;
  },
  turbopack: {
    root: __dirname,
    resolveAlias: {
      "react-router-dom": "./src/presentation/lib/react-router-compat.tsx",
      "@socket.io/component-emitter":
        "./node_modules/@socket.io/component-emitter/lib/esm/index.js",
    },
  },
};

export default nextConfig;
