import { PageHero, Section } from "@/components/marketing/section";

export type LegalSection = { heading: string; paragraphs: string[] };

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHero eyebrow={`Last updated ${updated}`} title={title} description={intro} />
      <Section>
        <div className="mx-auto max-w-2xl space-y-10">
          {sections.map((section) => (
            <div key={section.heading}>
              <h2 className="mb-3 text-lg font-semibold">{section.heading}</h2>
              <div className="text-muted-foreground space-y-3 text-sm leading-relaxed">
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
