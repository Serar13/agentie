import { TopicPageTemplate } from "@/components/TopicPageTemplate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sport & Performanță - Fair-play și excelență sportivă",
  description: "Descoperă victorii deosebite, fair-play, sport de masă și campanii prin care sportul ajută societatea."
};

export default function Page() {
  return (
    <TopicPageTemplate
      title="Sport & Performanță"
      intro="Performanță deosebită, lecții de determinare, fair-play și sportul folosit ca instrument de integrare comunitară."
      categorySlug="sport-performanta"
    />
  );
}
