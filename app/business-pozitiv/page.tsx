import { TopicPageTemplate } from "@/components/TopicPageTemplate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Business Pozitiv - Economie socială și afaceri etice",
  description: "Descoperă afaceri cu impact social, antreprenoriat etic, locuri de muncă corecte și progres economic sustenabil."
};

export default function Page() {
  return (
    <TopicPageTemplate
      title="Business Pozitiv"
      intro="Cum pot companiile să rezolve probleme sociale? Aici listăm afaceri etice, antreprenoriat social și progres sustenabil."
      categorySlug="business-pozitiv"
    />
  );
}
