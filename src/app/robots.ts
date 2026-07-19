import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // App shell and auth surfaces are not for crawlers.
      disallow: [
        "/dashboard",
        "/jobs",
        "/candidates",
        "/clients",
        "/pipeline",
        "/placements",
        "/reports",
        "/settings",
        "/onboarding",
        "/api/",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
