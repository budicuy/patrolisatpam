import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "SAPA - Satpam Patroli",
        short_name: "SAPA",
        description: "Sistem Monitoring Patroli Satpam",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#3b82f6",
        orientation: "portrait",
        icons: [
            {
                src: "/icons/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable",
            },
            {
                src: "/icons/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
        ],
    };
}
