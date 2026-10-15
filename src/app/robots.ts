import type { MetadataRoute } from "next";
import { sito } from "@/lib/sito";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/account"] },
    sitemap: new URL("/sitemap.xml", sito.url).toString(),
  };
}
