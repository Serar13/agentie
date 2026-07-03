import { TopicPageTemplate } from "@/components/TopicPageTemplate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sănătate & Bine - Progrese Medicale și Soluții de Viață",
  description: "Cele mai bune știri din medicină, preventie, cercetare medicală și acțiuni de sprijin pentru pacienți."
};

export default function Page() {
  return (
    <TopicPageTemplate
      title="Sănătate & Bine"
      intro="Prevenție, descoperiri medicale, povești despre medici de excepție și asistență socială oferită celor în dificultate."
      categorySlug="sanatate-bine"
    />
  );
}
