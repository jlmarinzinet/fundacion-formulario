/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Increase the body-size limit for the upload proxy route.
  // Next.js defaults to 1 MB which would reject most doc uploads.
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

module.exports = nextConfig;
