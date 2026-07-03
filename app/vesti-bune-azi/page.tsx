import { TopicPageTemplate } from "@/components/TopicPageTemplate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vești Bune Azi - Doar Știri Pozitive de Astăzi",
  description: "Fii la curent cu evenimentele pozitive ale zilei. Știri verificate din educație, mediu, tehnologie și societate."
};

export default function Page() {
  return (
    <TopicPageTemplate
      title="Vești Bune Azi"
      intro="Rămâi informat fără zgomot și alarmism. Vezi ce s-a întâmplat bun astăzi în comunitatea noastră."
      isTodayOnly={true}
    />
  );
}
