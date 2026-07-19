import { Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";

import { PageHero, Section } from "@/components/marketing/section";
import { company } from "@/content/site";

import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start a hiring brief or ask us anything — we respond within one business day.",
};

const details = [
  { icon: Mail, label: "Email", value: company.email },
  { icon: Phone, label: "Phone", value: company.phone },
  { icon: MapPin, label: "Offices", value: company.address },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's talk about your team"
        description="Hiring, job-seeking or partnership — tell us what you need and a consultant will come back within one business day."
      />
      <Section>
        <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            {details.map((detail) => (
              <div key={detail.label} className="flex items-start gap-3">
                <div className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-lg">
                  <detail.icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{detail.label}</p>
                  <p className="text-muted-foreground text-sm">{detail.value}</p>
                </div>
              </div>
            ))}
            <p className="text-muted-foreground text-sm leading-relaxed">
              Prefer to skip the form? Email us directly — every message is read by a
              consultant, not a ticketing system.
            </p>
          </div>
          <div className="lg:col-span-3">
            <ContactForm />
          </div>
        </div>
      </Section>
    </>
  );
}
