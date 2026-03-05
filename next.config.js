/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || "",
  reactStrictMode: true,
  // Increase the body-size limit for the upload proxy route.
  // Next.js defaults to 1 MB which would reject most doc uploads.
  serverExternalPackages: [],
  // Allow large uploads through middleware (default is 10 MB)
  experimental: {
    proxyClientMaxBodySize: "200mb",
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

module.exports = nextConfig;
