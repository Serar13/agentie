import { TopicPageTemplate } from "@/components/TopicPageTemplate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tech & Inovație - Tehnologie utilă și progres digital",
  description: "Descoperă noi inovații tehnologice, inovație digitală, digitalizare și produse care ne fac viața mai bună."
};

export default function Page() {
  return (
    <TopicPageTemplate
      title="Tech & Inovație"
      intro="Cum ne ajută tehnologia în mod practic? De la start-up-uri inovatoare la proiecte digitalizate cu impact real."
      categorySlug="tech-inovatie"
    />
  );
}
