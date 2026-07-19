import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { company } from "@/content/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of this website and our recruitment services.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="19 July 2026"
      intro="These terms govern your use of this website. Recruitment engagements are governed by separate written terms of business issued per client or candidate."
      sections={[
        {
          heading: "Use of this website",
          paragraphs: [
            "Content on this site is provided for general information about our services. You may not misuse the site, attempt unauthorised access, or scrape candidate or client data.",
          ],
        },
        {
          heading: "Recruitment services",
          paragraphs: [
            `Placements, fees, guarantees and rebates are governed by ${company.name}'s written Terms of Business as agreed with each client, and by the candidate terms accepted at registration. Nothing on this website constitutes an offer capable of acceptance.`,
            "Salary figures, statistics and timelines shown on this site are illustrative of past performance and market conditions and are not guarantees of future outcomes.",
          ],
        },
        {
          heading: "Intellectual property",
          paragraphs: [
            "All content, branding and the RecruitOS platform are the property of their respective owners. You may not reproduce them without written permission.",
          ],
        },
        {
          heading: "Liability",
          paragraphs: [
            "To the maximum extent permitted by law, we are not liable for loss arising from reliance on website content. Liability arising from recruitment engagements is addressed in the applicable Terms of Business.",
          ],
        },
        {
          heading: "Governing law",
          paragraphs: [
            "These website terms are governed by the laws of the Republic of South Africa. Client Terms of Business may specify English law where agreed.",
          ],
        },
        {
          heading: "Contact",
          paragraphs: [`Questions about these terms: ${company.email}.`],
        },
      ]}
    />
  );
}
