import { TopicPageTemplate } from "@/components/TopicPageTemplate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cultură & Evenimente - Artă, patrimoniu și comunitate",
  description: "Cele mai importante festivaluri, restaurări de patrimoniu, artă comunitară și evenimente culturale accesibile."
};

export default function Page() {
  return (
    <TopicPageTemplate
      title="Cultură & Evenimente"
      intro="Arta ca mod de conectare, salvări de patrimoniu istoric și evenimente culturale care ne apropie unii de alții."
      categorySlug="cultura-evenimente"
    />
  );
}
