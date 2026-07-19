import { Flame } from "lucide-react";
import Link from "next/link";

import { company } from "@/content/site";

const columns = [
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/case-studies", label: "Case studies" },
      { href: "/testimonials", label: "Testimonials" },
      { href: "/careers", label: "Careers" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Services",
    links: [
      { href: "/services", label: "All services" },
      { href: "/industries", label: "Industries" },
      { href: "/for-employers", label: "For employers" },
      { href: "/for-candidates", label: "For candidates" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { href: "/browse-jobs", label: "Browse jobs" },
      { href: "/blog", label: "Blog" },
      { href: "/resources", label: "Resource hub" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
      { href: "/cookie-policy", label: "Cookie policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-6">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-semibold">
              <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
                <Flame className="size-4" />
              </span>
              RecruitOS
            </div>
            <p className="text-muted-foreground mt-4 max-w-xs text-sm">
              {company.tagline}. {company.address}.
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.heading}>
              <h3 className="text-sm font-semibold">{column.heading}</h3>
              <ul className="mt-4 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-muted-foreground mt-12 flex flex-col items-center justify-between gap-2 border-t pt-6 text-xs sm:flex-row">
          <p>
            © {new Date().getFullYear()} {company.name}. All rights reserved.
          </p>
          <p>Powered by RecruitOS — a Move Digital platform</p>
        </div>
      </div>
    </footer>
  );
}
