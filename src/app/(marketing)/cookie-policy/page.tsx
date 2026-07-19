import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { company } from "@/content/site";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "What cookies this site uses and why.",
};

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      updated="19 July 2026"
      intro="We keep cookies to the minimum needed to run the site. No advertising trackers, no third-party analytics cookies without consent."
      sections={[
        {
          heading: "Strictly necessary cookies",
          paragraphs: [
            "Authentication and session cookies keep you signed in to the client and candidate portals, and a theme preference is stored locally to remember your light/dark choice. These are required for the site to function and cannot be switched off.",
          ],
        },
        {
          heading: "Analytics",
          paragraphs: [
            "If we introduce analytics, they will be privacy-preserving, cookie-free where possible, and this policy will be updated before anything is deployed.",
          ],
        },
        {
          heading: "Managing cookies",
          paragraphs: [
            "You can clear or block cookies in your browser settings. Blocking strictly necessary cookies will prevent portal sign-in from working.",
          ],
        },
        {
          heading: "Contact",
          paragraphs: [`Questions: ${company.email}.`],
        },
      ]}
    />
  );
}
