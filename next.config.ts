import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.88.60'],
  async headers() {
    return [
      { source: '/:path*', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'same-origin' },
      ] },
      // Legacy uploads are untrusted, even files stored before validation was added.
      { source: '/img/:path*', headers: [
        { key: 'Content-Security-Policy', value: "default-src 'none'; sandbox" },
        { key: 'Content-Disposition', value: 'attachment' },
      ] },
    ]
  },
};

export default nextConfig;
