import type { NextConfig } from "next";
const config: NextConfig = {
  turbopack: {root: process.cwd()},
  poweredByHeader: false,
  output:"standalone",
  outputFileTracingExcludes: {"/*": ["./.pilot-feedback/**/*", "./var/**/*", "./evidence/**/*", "./.env*", "./tests/**/*", "./e2e/**/*"]},
  async headers() {
    return [{source: "/:path*", headers: [
      {key: "Referrer-Policy", value: "no-referrer"},
      {key: "X-Content-Type-Options", value: "nosniff"},
      {key: "X-Frame-Options", value: "DENY"},
      {key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()"}
      ,{key:"Content-Security-Policy",value:`default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV==="development"?" 'unsafe-eval'":""}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`}
    ]}];
  }
};
export default config;
