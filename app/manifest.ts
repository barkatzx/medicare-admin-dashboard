import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MediCarePLC Admin Dashboard",
    short_name: "MediCarePLC",
    description: "Modern admin dashboard for managing your business",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#F9FAFB",
    theme_color: "#F9FAFB",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
