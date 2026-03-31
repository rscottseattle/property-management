import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://testing.preachos.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing"],
        disallow: [
          "/dashboard",
          "/properties",
          "/tenants",
          "/finances",
          "/maintenance",
          "/vendors",
          "/bookings",
          "/guests",
          "/reports",
          "/settings",
          "/notifications",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
