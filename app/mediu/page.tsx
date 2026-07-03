import { TopicPageTemplate } from "@/components/TopicPageTemplate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mediu - Protecția Naturii și Sustenabilitate",
  description: "Descoperă știri despre biodiversitate, climă, împăduriri, ecologie, reciclare și conservarea naturii."
};

export default function Page() {
  return (
    <TopicPageTemplate
      title="Mediu"
      intro="Inițiative ecologice de succes, restaurări de habitate naturale, campanii de reciclare și tehnologii sustenabile."
      categorySlug="mediu"
    />
  );
}
