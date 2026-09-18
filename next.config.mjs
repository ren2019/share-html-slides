/** @type {import('next').NextConfig} */
const config = { poweredByHeader: false, distDir: process.env.NEXT_DIST_DIR || '.next' };
export default config;
