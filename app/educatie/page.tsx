import { TopicPageTemplate } from "@/components/TopicPageTemplate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Educație - Știri Pozitive din Școli și Universități",
  description: "Află proiecte educaționale, burse, olimpiade, profesori dedicați și inovație didactică în România."
};

export default function Page() {
  return (
    <TopicPageTemplate
      title="Educație"
      intro="Sprijinirea învățării, modernizarea școlilor și povești inspiraționale din rândul profesorilor și elevilor români."
      categorySlug="educatie"
    />
  );
}
