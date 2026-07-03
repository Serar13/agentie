import { TopicPageTemplate } from "@/components/TopicPageTemplate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "România Bună - Inițiative Civice și Comunitare",
  description: "Descoperă comunități unite, voluntari devotați și proiecte locale care produc impact social pozitiv în România."
};

export default function Page() {
  return (
    <TopicPageTemplate
      title="România Bună"
      intro="Locul dedicat inițiativelor civice, solidarității comunitare și oamenilor care pun umărul la rezolvarea problemelor."
      categorySlug="romania-buna"
    />
  );
}
