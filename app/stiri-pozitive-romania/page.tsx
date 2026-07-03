import { TopicPageTemplate } from "@/components/TopicPageTemplate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Știri Pozitive România - Progres și Inițiative Constructive",
  description: "Cele mai importante știri pozitive din România. Oameni care schimbă comunități, inovație și progres social."
};

export default function Page() {
  return (
    <TopicPageTemplate
      title="Știri Pozitive România"
      intro="Aici adunăm exclusiv faptele bune, ideile curajoase și progresul social verificat din toate județele țării."
    />
  );
}
