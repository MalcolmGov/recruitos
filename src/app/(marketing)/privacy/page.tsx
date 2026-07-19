import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { company } from "@/content/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Meridian Talent Partners collects, uses and protects personal information under POPIA and GDPR.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="19 July 2026"
      intro="We process personal information under South Africa's POPIA and, for UK/EU data subjects, the UK and EU GDPR. This policy explains what we collect, why, and your rights."
      sections={[
        {
          heading: "Who we are",
          paragraphs: [
            `${company.name} ("we", "us") is a recruitment agency operating from South Africa and serving clients in the United Kingdom. For the purposes of data-protection law, we are the responsible party (POPIA) and data controller (GDPR) for personal information processed through this website and our recruitment services.`,
          ],
        },
        {
          heading: "What we collect",
          paragraphs: [
            "Candidates: identity and contact details, CV and work history, qualifications, right-to-work documentation, salary expectations, interview notes and references — provided by you or collected with your consent.",
            "Clients: business contact details, role requirements and commercial terms.",
            "Website visitors: contact-form submissions and limited technical data necessary to operate the site.",
          ],
        },
        {
          heading: "Why we process it",
          paragraphs: [
            "To provide recruitment services (matching, shortlisting, interview coordination, placement and aftercare); to meet legal obligations including right-to-work verification; and, with your consent, to keep your profile active for future opportunities.",
            "We do not sell personal information. We share candidate details with a client only for roles you have agreed to be represented for.",
          ],
        },
        {
          heading: "Retention",
          paragraphs: [
            "Candidate profiles are retained while your consent remains active and reviewed at regular intervals. You may withdraw consent at any time, after which your data is deleted or anonymised unless a legal obligation requires retention.",
          ],
        },
        {
          heading: "Your rights",
          paragraphs: [
            "You have the right to access, correct, delete and port your personal information, to object to processing, and to withdraw consent. To exercise any right, contact us at the address below. You may also complain to the Information Regulator (South Africa) or the ICO (United Kingdom).",
          ],
        },
        {
          heading: "Contact",
          paragraphs: [`Privacy queries: ${company.email}. ${company.address}.`],
        },
      ]}
    />
  );
}
