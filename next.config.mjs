import os from "node:os";

const PORT = Number(process.env.PORT) || 3000;

/**
 * Auto-detect this machine's LAN IPv4 addresses so the dev server (and its
 * Server Actions) work when opened from your phone / other devices on the same
 * network — e.g. http://192.168.1.42:3000. Without this, Next.js 15 rejects
 * Server Action POSTs from a non-localhost origin and the client shows
 * "fetchServerAction → Failed to fetch".
 */
function lanHosts() {
  const hosts = new Set();
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces ?? []) {
      if (iface.family === "IPv4" && !iface.internal) hosts.add(iface.address);
    }
  }
  return [...hosts];
}

// Extra origins (e.g. an ngrok/tunnel domain) via ALLOWED_ORIGINS="host1,host2".
const extra = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const hostnames = ["localhost", "127.0.0.1", ...lanHosts()];
const withPort = hostnames.map((h) => `${h}:${PORT}`);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets LAN/mobile devices load dev resources (HMR, RSC payloads).
  allowedDevOrigins: [...hostnames, ...extra.map((o) => o.replace(/:\d+$/, ""))],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion", "@react-three/drei", "date-fns"],
    // Origins allowed to invoke Server Actions (fixes "Failed to fetch" over LAN).
    serverActions: {
      allowedOrigins: [...hostnames, ...withPort, ...extra],
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
