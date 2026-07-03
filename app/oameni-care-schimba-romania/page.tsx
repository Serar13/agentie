import { TopicPageTemplate } from "@/components/TopicPageTemplate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Oameni care Schimbă România - Portrete și povești inspiraționale",
  description: "Portrete ale oamenilor care pun umărul pentru a schimba România în bine. Lideri locali, voluntari și mentori."
};

export default function Page() {
  return (
    <TopicPageTemplate
      title="Oameni care Schimbă România"
      intro="Povești inspiraționale despre indivizi excepționali care schimbă mentalități și fac performanță deosebită în comunitățile lor."
    />
  );
}
