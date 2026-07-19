import type { MetadataRoute } from "next";

import { articles, caseStudies } from "@/content/site";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "/about",
    "/services",
    "/industries",
    "/for-employers",
    "/for-candidates",
    "/browse-jobs",
    "/pricing",
    "/resources",
    "/blog",
    "/case-studies",
    "/testimonials",
    "/faq",
    "/contact",
    "/careers",
    "/privacy",
    "/terms",
    "/cookie-policy",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const articlePages = articles.map((article) => ({
    url: `${BASE_URL}/blog/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const caseStudyPages = caseStudies.map((study) => ({
    url: `${BASE_URL}/case-studies/${study.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...articlePages, ...caseStudyPages];
}
