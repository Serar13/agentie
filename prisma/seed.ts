import { PrismaClient } from "@prisma/client";
import { CATEGORY_SEED } from "../lib/constants";
import { uniqueSlug } from "../lib/slug";
import { hashPassword } from "../lib/auth";

const prisma = new PrismaClient();

async function main() {
  // Curățare date anterioare
  await prisma.analyticsEvent.deleteMany();
  await prisma.costLog.deleteMany();
  await prisma.articleReference.deleteMany();
  await prisma.newsArticle.deleteMany();
  await prisma.source.deleteMany();
  await prisma.category.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
  await prisma.newsletter.deleteMany();
  await prisma.communitySubmission.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();
  await prisma.scanCache.deleteMany();

  // 1. Creare Categorii
  const categories = [];
  for (const cat of CATEGORY_SEED) {
    const created = await prisma.category.create({
      data: cat
    });
    categories.push(created);
  }
  const categoryMap = new Map(categories.map((c) => [c.slug, c]));

  // 2. Creare Utilizatori (inclusiv Admin default)
  const adminPassword = hashPassword("admin123");
  const readerPassword = hashPassword("reader123");
  await prisma.user.createMany({
    data: [
      {
        email: "admin@vestibune.ro",
        name: "Editor Principal",
        passwordHash: adminPassword,
        role: "admin",
        location: "București"
      },
      {
        email: "cititor@exemplu.ro",
        name: "Mihai Popescu",
        passwordHash: readerPassword,
        role: "reader",
        location: "Cluj-Napoca",
        followedCategories: "mediu,educatie",
        savedArticles: ""
      }
    ]
  });

  // 3. Creare 10 Surse RSS/Manuale Pro
  const source1 = await prisma.source.create({
    data: {
      name: "Good News Network",
      type: "rss",
      url: "https://www.goodnewsnetwork.org/feed/",
      status: "active",
      trustScore: 85,
      scanFrequencyMin: 30,
      articlesExtracted: 145,
      articlesAccepted: 24,
      articlesRejected: 121,
      blacklistKeywords: "accident,crima,deces,razboi",
      whitelistKeywords: "school,nature,medical,innovative",
      notes: "Sursa RSS internationala majora."
    }
  });

  const source2 = await prisma.source.create({
    data: {
      name: "Positive News UK",
      type: "rss",
      url: "https://www.positive.news/feed/",
      status: "active",
      trustScore: 90,
      scanFrequencyMin: 60,
      articlesExtracted: 98,
      articlesAccepted: 32,
      articlesRejected: 66,
      blacklistKeywords: "accident,incident,tragedy",
      notes: "Sursa RSS UK de incredere."
    }
  });

  await prisma.source.createMany({
    data: [
      {
        name: "Propuneri Manuale Editor",
        type: "manual",
        url: "https://example.com/manual-sources",
        status: "paused",
        trustScore: 95,
        scanFrequencyMin: 120,
        notes: "Lista interna pentru review"
      },
      {
        name: "Eco-Știri România",
        type: "rss",
        url: "https://example.com/rss-eco",
        status: "active",
        categoryId: categoryMap.get("mediu")?.id || null,
        trustScore: 80,
        scanFrequencyMin: 60,
        blacklistKeywords: "incendiu,poluare,amenda",
        whitelistKeywords: "impadurire,solar,parc,reciclare"
      },
      {
        name: "Educația Azi",
        type: "rss",
        url: "https://example.com/rss-educatie",
        status: "active",
        categoryId: categoryMap.get("educatie")?.id || null,
        trustScore: 75,
        scanFrequencyMin: 60,
        whitelistKeywords: "olimpiada,profesor,bursa,scoala"
      },
      {
        name: "Inovație Medicală",
        type: "rss",
        url: "https://example.com/rss-sanatate",
        status: "active",
        categoryId: categoryMap.get("sanatate-bine")?.id || null,
        trustScore: 88,
        scanFrequencyMin: 120
      },
      {
        name: "Tech pentru Oameni",
        type: "rss",
        url: "https://example.com/rss-tech",
        status: "active",
        categoryId: categoryMap.get("tech-inovatie")?.id || null,
        trustScore: 82,
        scanFrequencyMin: 45
      },
      {
        name: "Artă și Comunitate",
        type: "rss",
        url: "https://example.com/rss-cultura",
        status: "active",
        categoryId: categoryMap.get("cultura-evenimente")?.id || null,
        trustScore: 78,
        scanFrequencyMin: 180
      },
      {
        name: "Sport pentru Toți",
        type: "rss",
        url: "https://example.com/rss-sport",
        status: "paused",
        categoryId: categoryMap.get("sport-performanta")?.id || null,
        trustScore: 80,
        scanFrequencyMin: 60
      },
      {
        name: "Afaceri Etice",
        type: "rss",
        url: "https://example.com/rss-business",
        status: "blocked",
        categoryId: categoryMap.get("business-pozitiv")?.id || null,
        trustScore: 85,
        scanFrequencyMin: 60,
        notes: "Sursa blocata din cauza clickbait-ului comercial frecvent."
      }
    ]
  });

  // 4. Creare 30 de Articole Pozitive (distribuite)
  const articlesData = [
    // 1. Educatie
    {
      title: "Olimpicii români se întorc cu 5 medalii de aur de la Olimpiada de Fizică",
      subtitle: "Rezultat de excepție pentru echipa națională de fizică în Asia.",
      lead: "Echipa națională a României a cucerit locul 1 în clasamentul european la Olimpiada Internațională de Fizică de anul acesta, obținând 5 medalii de aur.",
      content: "Competiția s-a desfășurat la Tokyo și a reunit peste 80 de țări. Elevii români s-au antrenat intens alături de profesori universitari din București. Această victorie reconfirmă potențialul excepțional al tinerilor noștri în domeniul științelor exacte.\n\nSponsorii locali au anunțat deja acordarea unor burse speciale de merit pentru a-i sprijini în studiile universitare viitoare.",
      categorySlug: "educatie",
      status: "published",
      positiveScore: 95,
      confidenceScore: 98,
      sourceQualityScore: 95,
      originalityScore: 88,
      editorialScore: 92,
      riskLevel: "low",
      publishedAt: new Date("2026-06-25T08:30:00Z"),
      sourceName: "Educația Națională",
      originalUrl: "https://example.com/stire-olimpici-fizica"
    },
    {
      title: "Școala rurală din Apuseni care folosește energie solară și tablete interactive",
      subtitle: "Un exemplu remarcabil de modernizare digitală prin eforturi locale.",
      lead: "O școală mică dintr-un sat izolat din Munții Apuseni a fost transformată integral cu sprijinul unei asociații de părinți și a donatorilor.",
      content: "Cu ajutorul panourilor fotovoltaice donate de o firmă românească, școala își asigură acum gratuit energia electrică. În plus, copiii învață pe tablete interactive conectate la internet prin satelit. Numărul de elevi din sat a crescut în ultimul an datorită noilor facilități atractive.",
      categorySlug: "educatie",
      status: "published",
      positiveScore: 92,
      confidenceScore: 94,
      sourceQualityScore: 90,
      originalityScore: 90,
      editorialScore: 91,
      riskLevel: "low",
      publishedAt: new Date("2026-06-24T10:00:00Z"),
      sourceName: "Monitorul Apuseni",
      originalUrl: "https://example.com/scoala-solara-apuseni"
    },
    {
      title: "Program național de mentorat pentru tinerii din mediul rural",
      subtitle: "Peste 1000 de profesori s-au înscris voluntar pentru a sprijini elevii.",
      lead: "Un nou proiect civic oferă ore gratuite de pregătire pentru elevii de clasa a VIII-a care provin din medii defavorizate.",
      content: "Programul își propune reducerea abandonului școlar la intrarea în liceu. Voluntarii predau matematică și limba română în weekend, online sau fizic. Primele rezultate arată o promovabilitate de peste 85% în rândul elevilor sprijiniți.",
      categorySlug: "educatie",
      status: "published",
      positiveScore: 88,
      confidenceScore: 90,
      sourceQualityScore: 85,
      originalityScore: 85,
      editorialScore: 87,
      riskLevel: "low",
      publishedAt: new Date("2026-06-23T11:15:00Z"),
      sourceName: "Asociația Învață",
      originalUrl: "https://example.com/mentorat-rural-romania"
    },
    {
      title: "Biblioteca comunală transformată în centru cultural modern",
      subtitle: "Locuitorii din Sânpetru se bucură de un nou spațiu multifuncțional.",
      lead: "Vechea clădire a bibliotecii din localitate a fost renovată și dotată cu imprimante 3D și echipamente de realitate virtuală.",
      content: "Spațiul găzduiește acum ateliere gratuite de robotică, seri de lectură pentru bătrâni și proiecții de documentare. Proiectul a costat 15.000 de euro și a fost finanțat prin bugetare participativă locală.",
      categorySlug: "educatie",
      status: "approved",
      positiveScore: 85,
      confidenceScore: 88,
      sourceQualityScore: 80,
      originalityScore: 85,
      editorialScore: 84,
      riskLevel: "low",
      sourceName: "Vocea Brașovului",
      originalUrl: "https://example.com/biblioteca-sanpetru-modernizata"
    },

    // 2. Mediu
    {
      title: "Peste 5.000 de puieți de stejar plantați pe un teren degradat din Dolj",
      subtitle: "Campania de împădurire a reunit voluntari de toate vârstele.",
      lead: "Un fost teren nisipos și degradat din sudul țării a fost transformat într-o viitoare pădure de stejar cu ajutorul voluntarilor.",
      content: "Mobilizarea a durat o singură zi, la acțiune participând elevi, pensionari și angajați ai companiilor locale. Terenul a fost pus la dispoziție de primăria locală. Organizatorii promit să monitorizeze puieții în următorii 3 ani pentru a asigura prinderea lor.",
      categorySlug: "mediu",
      status: "published",
      positiveScore: 94,
      confidenceScore: 92,
      sourceQualityScore: 88,
      originalityScore: 88,
      editorialScore: 91,
      riskLevel: "low",
      publishedAt: new Date("2026-06-25T09:00:00Z"),
      sourceName: "EcoDolj",
      originalUrl: "https://example.com/impadurire-stejar-dolj"
    },
    {
      title: "Parcul Natural Văcărești primește o nouă zonă de observare a păsărilor",
      subtitle: "Facilități noi pentru pasionații de ornitologie în inima Bucureștiului.",
      lead: "Administrația Parcului Natural Văcărești a finalizat construcția a două foișoare moderne destinate observării avifaunei.",
      content: "Peste 180 de specii de păsări trăiesc în această oază urbană. Foișoarele sunt construite ecologic, exclusiv din lemn certificat, și oferă panouri informative pentru copii. Accesul publicului este complet gratuit.",
      categorySlug: "mediu",
      status: "published",
      positiveScore: 90,
      confidenceScore: 94,
      sourceQualityScore: 92,
      originalityScore: 85,
      editorialScore: 89,
      riskLevel: "low",
      publishedAt: new Date("2026-06-24T12:00:00Z"),
      sourceName: "EcoPolis",
      originalUrl: "https://example.com/foisoare-vacaresti"
    },
    {
      title: "Orașul din România care a redus cu 40% deșeurile municipale trimise la groapă",
      subtitle: "Sistemul 'plătești pentru cât arunci' dă rezultate spectaculoase.",
      lead: "Municipiul Sfântu Gheorghe a înregistrat o reducere istorică a deșeurilor nereciclabile prin introducerea pubelelor inteligente.",
      content: "Fiecare gospodărie are o cartelă electronică, plătind doar pentru fracția umedă pe care o depune. Colectarea separată a hârtiei, plasticului și sticlei a crescut exponențial. Primăria folosește economiile făcute la depozitare pentru a finanța parcurile din oraș.",
      categorySlug: "mediu",
      status: "published",
      positiveScore: 89,
      confidenceScore: 88,
      sourceQualityScore: 85,
      originalityScore: 90,
      editorialScore: 88,
      riskLevel: "low",
      publishedAt: new Date("2026-06-22T08:15:00Z"),
      sourceName: "InfoMediu",
      originalUrl: "https://example.com/reciclare-sfantu-gheorghe"
    },
    {
      title: "O nouă specie de plantă rară a fost redescoperită în Parcul Național Retezat",
      subtitle: "Planta nu mai fusese observată în România de peste 50 de ani.",
      lead: "Biologii români au localizat un mic areal în care crește din nou o floare montană considerată dispărută din fauna Retezatului.",
      content: "Descoperirea arată succesul măsurilor stricte de protecție a rezervației. Zona a fost marcată discret pentru a preveni turismul invaziv, iar biologii studiază acum modalități de înmulțire controlată a semințelor.",
      categorySlug: "mediu",
      status: "approved",
      positiveScore: 87,
      confidenceScore: 85,
      sourceQualityScore: 90,
      originalityScore: 80,
      editorialScore: 84,
      riskLevel: "low",
      sourceName: "Revista Biologilor",
      originalUrl: "https://example.com/planta-rara-retezat"
    },

    // 3. Sanatate
    {
      title: "Spitalul Județean Iași a primit un robot chirurgical de ultimă generație",
      subtitle: "Chirurgia minim invazivă devine mult mai accesibilă în regiunea Moldovei.",
      lead: "O achiziție finanțată prin fonduri europene va permite efectuarea de operații extrem de precise pentru pacienții oncologici la Iași.",
      content: "Robotul medical scurtează timpul de spitalizare al pacienților de la 7 zile la doar 24 de ore. Peste 20 de chirurgi locali vor începe programe de specializare în Germania pentru a utiliza echipamentul în siguranță deplină.",
      categorySlug: "sanatate-bine",
      status: "published",
      positiveScore: 91,
      confidenceScore: 95,
      sourceQualityScore: 92,
      originalityScore: 85,
      editorialScore: 90,
      riskLevel: "low",
      publishedAt: new Date("2026-06-25T10:30:00Z"),
      sourceName: "Ziarul de Sănătate Iași",
      originalUrl: "https://example.com/robot-chirurgical-iasi"
    },
    {
      title: "Caravana stomatologică mobilă oferă consultații gratuite copiilor din sate",
      subtitle: "Peste 500 de copii din satele fără medic au fost tratați în această lună.",
      lead: "O clinică stomatologică mobilă, amenajată într-un autocar, a vizitat localitățile izolate din județul Vaslui.",
      content: "Voluntarii (medici tineri și rezidenți) fac sigilări de dinți, tratează carii ușoare și oferă pachete cu periuțe și paste de dinți. Campania este finanțată prin donații private și sponsorizări din industria de igienă orală.",
      categorySlug: "sanatate-bine",
      status: "published",
      positiveScore: 88,
      confidenceScore: 90,
      sourceQualityScore: 85,
      originalityScore: 85,
      editorialScore: 87,
      riskLevel: "low",
      publishedAt: new Date("2026-06-23T14:00:00Z"),
      sourceName: "Asociația Medicilor Zâmbitori",
      originalUrl: "https://example.com/caravana-stomatologica-vaslui"
    },
    {
      title: "Centru modern de recuperare deschis în regim de voluntariat pentru vârstnici",
      subtitle: "Un spațiu cald și dotat cu aparatură, oferit gratuit de o parohie din Arad.",
      lead: "Bătrânii din Arad au acum acces la ședințe gratuite de kinetoterapie și fizioterapie grație unei inițiative comunitare.",
      content: "Echipamentele au fost achiziționate prin donații ale comunității românești din străinătate. Doi kinetoterapeuți locali își oferă voluntar timpul de trei ori pe săptămână pentru a-i asista pe pacienți în exercițiile de recuperare.",
      categorySlug: "sanatate-bine",
      status: "published",
      positiveScore: 86,
      confidenceScore: 88,
      sourceQualityScore: 80,
      originalityScore: 85,
      editorialScore: 85,
      riskLevel: "low",
      publishedAt: new Date("2026-06-21T16:20:00Z"),
      sourceName: "Aradul Activ",
      originalUrl: "https://example.com/centru-recuperare-batrani-arad"
    },

    // 4. Tech
    {
      title: "Start-up românesc lansează un software de diagnostic rapid al culturilor agricole",
      subtitle: "Aplicația detectează bolile plantelor folosind doar camera telefonului.",
      lead: "Trei studenți din Cluj au creat o soluție AI destinată micilor producători pentru a preveni pierderea culturilor agricole.",
      content: "Aplicația analizează imaginea frunzelor și identifică deficiențele de nutrienți sau prezența paraziților în doar 3 secunde, oferind recomandări biologice de tratament. Peste 200 de fermieri locali testează deja aplicația cu rezultate excelente.",
      categorySlug: "tech-inovatie",
      status: "published",
      positiveScore: 92,
      confidenceScore: 91,
      sourceQualityScore: 85,
      originalityScore: 90,
      editorialScore: 90,
      riskLevel: "low",
      publishedAt: new Date("2026-06-25T11:00:00Z"),
      sourceName: "Cluj IT News",
      originalUrl: "https://example.com/startup-cluj-agri-ai"
    },
    {
      title: "O asociație lansează cursuri gratuite de robotică pentru fete din mediul rural",
      subtitle: "Proiectul își propune creșterea prezenței feminine în tehnologie.",
      lead: "Peste 120 de fete din comunele județului Olt învață limbaje de programare și asamblarea de mini-roboți în această vară.",
      content: "Atelierele sunt susținute de mentori din companii tehnologice și includ crearea de proiecte practice cum ar fi stații meteo minuscule sau sisteme automate de irigare a grădinilor școlare.",
      categorySlug: "tech-inovatie",
      status: "published",
      positiveScore: 89,
      confidenceScore: 90,
      sourceQualityScore: 88,
      originalityScore: 85,
      editorialScore: 87,
      riskLevel: "low",
      publishedAt: new Date("2026-06-24T14:30:00Z"),
      sourceName: "SmartOlt",
      originalUrl: "https://example.com/robotica-fete-olt"
    },

    // 5. Cultura
    {
      title: "Cetatea Rupea atinge un număr record de vizitatori după renovare",
      subtitle: "Peste 100.000 de turiști au vizitat fortăreața transilvăneană în ultimul an.",
      lead: "Restaurarea cetății cu fonduri guvernamentale și locale a repus Rupea pe harta turismului istoric românesc.",
      content: "Evenimentele culturale desfășurate în curtea interioară - piese de teatru medieval, festivaluri acustice și expoziții de sculptură locală - au dinamizat comunitatea. Peste 20 de noi pensiuni s-au deschis în zonă, aducând locuri de muncă.",
      categorySlug: "cultura-evenimente",
      status: "published",
      positiveScore: 90,
      confidenceScore: 92,
      sourceQualityScore: 88,
      originalityScore: 85,
      editorialScore: 88,
      riskLevel: "low",
      publishedAt: new Date("2026-06-25T12:00:00Z"),
      sourceName: "Turism Cultural",
      originalUrl: "https://example.com/cetatea-rupea-record"
    },
    {
      title: "Voluntarii 'Ambulanței pentru Monumente' salvează biserica de lemn din Urși",
      subtitle: "Intervenție de urgență pentru conservarea picturii de secol XVIII.",
      lead: "O echipă formată din tineri arhitecți și meșteri restauratori a finalizat înlocuirea acoperișului deteriorat al bisericii.",
      content: "Biserica risca să fie distrusă complet de infiltrări de apă. Mobilizarea s-a făcut exclusiv din fonduri private, meșterii locali punându-și gratuit la dispoziție cunoștințele de prelucrare a șindrilei conform tehnicilor tradiționale.",
      categorySlug: "cultura-evenimente",
      status: "published",
      positiveScore: 91,
      confidenceScore: 93,
      sourceQualityScore: 90,
      originalityScore: 88,
      editorialScore: 90,
      riskLevel: "low",
      publishedAt: new Date("2026-06-23T16:00:00Z"),
      sourceName: "Patrimoniu Ro",
      originalUrl: "https://example.com/biserica-lemn-ursi-salvata"
    },

    // 6. Sport
    {
      title: "Baschetbalistul român de 16 ani semnează un contract cu academia Real Madrid",
      subtitle: "Un talent deosebit recunoscut la nivel european.",
      lead: "Ștefan Popescu, un tânăr jucător de baschet din Ploiești, își va continua dezvoltarea sportivă în Spania.",
      content: "Ștefan a fost observat în timpul campionatului național de juniori unde a înregistrat statistici impresionante. Transferul lui arată calitatea cluburilor de baschet din România și oferă o mare doză de motivație colegilor săi de generație.",
      categorySlug: "sport-performanta",
      status: "published",
      positiveScore: 89,
      confidenceScore: 90,
      sourceQualityScore: 85,
      originalityScore: 80,
      editorialScore: 86,
      riskLevel: "low",
      publishedAt: new Date("2026-06-25T13:00:00Z"),
      sourceName: "BaschetRo",
      originalUrl: "https://example.com/stefan-popescu-real-madrid"
    },
    {
      title: "Peste 2.000 de alergători au strâns fonduri pentru copiii autiști la Maratonul Sibiului",
      subtitle: "Cea mai mare mobilizare de strângere de fonduri sportive din Sibiu.",
      lead: "Ediția din acest an a strâns peste 40.000 de euro care vor asigura ședințe de terapie specializată pentru copii.",
      content: "Sibienii au alergat pe distanțe diverse în cadrul centrului vechi. Banii vor fi administrați de o asociație locală care oferă sprijin direct familiilor afectate. Toți participanții au primit medalii lucrate manual de copiii asistați.",
      categorySlug: "sport-performanta",
      status: "published",
      positiveScore: 93,
      confidenceScore: 94,
      sourceQualityScore: 90,
      originalityScore: 85,
      editorialScore: 91,
      riskLevel: "low",
      publishedAt: new Date("2026-06-24T17:00:00Z"),
      sourceName: "Sibiu Independent",
      originalUrl: "https://example.com/maraton-sibiu-autism"
    },

    // 7. Business Pozitiv
    {
      title: "Cooperativa agricolă din Dolj care livrează legume direct în piețele mari",
      subtitle: "30 de mici producători s-au unit pentru a asigura prețuri corecte.",
      lead: "O inițiativă din sudul țării elimină intermediarii din lanțul de distribuție al legumelor proaspete.",
      content: "Asocierea le permite țăranilor să își vândă marfa la un preț echitabil și să asigure cantități mari cerute de supermarketuri. Cooperativa a înregistrat o cifră de afaceri stabilă, permițându-le tinerilor să revină în agricultură.",
      categorySlug: "business-pozitiv",
      status: "published",
      positiveScore: 90,
      confidenceScore: 88,
      sourceQualityScore: 85,
      originalityScore: 90,
      editorialScore: 89,
      riskLevel: "low",
      publishedAt: new Date("2026-06-25T14:00:00Z"),
      sourceName: "Economia Curată",
      originalUrl: "https://example.com/cooperativa-agricola-dolj"
    },

    // 8. Romania buna
    {
      title: "Bătrânii dintr-un azil primesc scrisori calde de la copii de școală primară",
      subtitle: "Campania 'Scrie un zâmbet' unește două generații în județul Mureș.",
      lead: "Peste 200 de scrisori scrise de mână au adus zâmbete și lacrimi de bucurie bătrânilor internați în căminul local.",
      content: "Proiectul a pornit de la o învățătoare care și-a dorit să le cultive copiilor empatia. Fiecare copil a adoptat simbolic un bunic, promițându-i să îi trimită scrisori lunar și să îl viziteze alături de părinți de sărbători.",
      categorySlug: "romania-buna",
      status: "published",
      positiveScore: 95,
      confidenceScore: 90,
      sourceQualityScore: 88,
      originalityScore: 85,
      editorialScore: 90,
      riskLevel: "low",
      publishedAt: new Date("2026-06-25T15:00:00Z"),
      sourceName: "Mureșul Civic",
      originalUrl: "https://example.com/scrisori-azil-mures"
    },

    // Adaugam articole suplimentare pentru a atinge numarul de 30!
    // Voi repeta si adapta structurile pe diverse categorii
    ...Array.from({ length: 12 }).map((_, i) => ({
      title: `DEMO: Inițiativă pozitivă suplimentară ${i + 1}`,
      subtitle: "Articol generat ca date demo pentru volum.",
      lead: "O scurtă descriere demonstrativă ce arată un progres local.",
      content: "Acest articol a fost adăugat automat la seeding pentru a atinge ținta de 30 de materiale active necesară testării performanței și paginării sistemului. Conține diacritice, structură curată și se comportă ca o știre publicată standard din categoria sa.",
      categorySlug: i % 2 === 0 ? "tech-inovatie" : i % 3 === 0 ? "mediu" : "romania-buna",
      status: i % 4 === 0 ? "needs_review" : i % 5 === 0 ? "approved" : "published",
      positiveScore: 78 + (i % 15),
      confidenceScore: 82 + (i % 13),
      sourceQualityScore: 80,
      originalityScore: 80,
      editorialScore: 80,
      riskLevel: "low",
      publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Date diferite in trecut
      sourceName: "Sursă de testare",
      originalUrl: `https://example.com/demo-news-volume-${i + 1}`
    }))
  ];

  for (const [index, art] of articlesData.entries()) {
    const category = categoryMap.get(art.categorySlug);
    if (!category) continue;

    const created = await prisma.newsArticle.create({
      data: {
        title: art.title,
        slug: uniqueSlug(art.title, index + 1),
        subtitle: art.subtitle,
        lead: art.lead,
        content: art.content,
        categoryId: category.id,
        status: art.status,
        positiveScore: art.positiveScore,
        confidenceScore: art.confidenceScore,
        sourceQualityScore: art.sourceQualityScore,
        originalityScore: art.originalityScore,
        editorialScore: art.editorialScore,
        riskLevel: art.riskLevel,
        sourceName: art.sourceName,
        originalUrl: art.originalUrl,
        scannedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        approvedAt: art.status === "approved" || art.status === "published" ? new Date() : null,
        publishedAt: art.status === "published" ? art.publishedAt : null,
        socialFacebook: `${art.title}\n\nFără reclame. Fără panică. Doar vești bune.`,
        socialInstagram: `${art.title}\n\nO veste bună pe zi schimbă ritmul informației.`,
        socialLinkedin: `${art.title}\n\nUn model de progres verificabil.`,
        socialTiktok: `[Script] Hook: Știai că...`,
        socialYoutube: `[YouTube Shorts] Fapte rapide...`,
        socialVideoHooks: `1. Aceasta este vestea zilei!\n2. Uimitor dar adevărat.\n3. De ce este important.`,
        socialReelText: "Impact Pozitiv",
        socialHashtags: "#vestibune #romaniabuna",
        newsletterBlurb: `Pe scurt: ${art.lead}`
      }
    });

    if (art.originalUrl) {
      await prisma.articleReference.create({
        data: {
          articleId: created.id,
          title: art.title,
          outlet: art.sourceName || "Sursă",
          url: art.originalUrl,
          verified: index % 2 === 0
        }
      });
    }

    // Adăugare costuri logate
    await prisma.costLog.createMany({
      data: [
        {
          articleId: created.id,
          agentName: "positive_filter",
          model: "mock-cheap",
          inputTokens: 380,
          outputTokens: 120,
          estimatedCostEur: 0.0052
        },
        {
          articleId: created.id,
          agentName: "fact_check_agent",
          model: "mock-factcheck",
          inputTokens: 520,
          outputTokens: 180,
          estimatedCostEur: 0.0094
        },
        {
          articleId: created.id,
          agentName: "quality_gate",
          model: "mock-factcheck",
          inputTokens: 600,
          outputTokens: 150,
          estimatedCostEur: 0.0078
        }
      ]
    });
  }

  // 5. Creare 5 Propuneri Cititori (Submissions)
  await prisma.communitySubmission.createMany({
    data: [
      {
        title: "Asociația locală plantează copaci în parcul din cartier",
        description: "Vrem să strângem voluntari pentru a planta 100 de mesteceni sâmbătă în cartierul nostru. Primăria ne oferă puieții și lopețile, avem nevoie de forță de muncă.",
        category: "Mediu",
        location: "Cluj-Napoca",
        sourceLink: "https://example.com/civic-cluj-planting",
        contactName: "Andreea Pop",
        contactEmail: "andreea@exemplu.ro",
        contactConsent: true,
        status: "submitted",
        aiAnalysis: JSON.stringify({
          isPositive: true,
          hasSources: true,
          draftTitle: "Asociația din Cluj-Napoca va planta 100 de mesteceni cu voluntari",
          draftLead: "O acțiune comunitară în weekend își propune revitalizarea parcului din cartier.",
          draftContent: "Voluntarii vor planta arbori sâmbăta aceasta cu sprijinul primăriei...",
          needsClarification: false,
          clarificationQuestion: ""
        })
      },
      {
        title: "Tânăr din sat premiat la olimpiadă",
        description: "Vă scriu pentru că un copil excepțional din comuna noastră, care învață la lumina lumânării de multe ori, a luat premiul I la olimpiada județeană de matematică.",
        category: "Educatie",
        location: "Gănești, Dolj",
        sourceLink: "https://example.com/olimpiada-dolj-math",
        contactName: "Prof. Vasile Radu",
        contactEmail: "vasile@exemplu.ro",
        contactConsent: true,
        status: "under_review"
      },
      {
        title: "S-a deschis o patiserie cu produse din ingrediente 100% bio",
        description: "Am lansat o afacere de familie în satul nostru unde coacem pâine și cozonaci folosind grâu măcinat la piatră și ingrediente organice de la țărani.",
        category: "Business pozitiv",
        location: "Gura Râului, Sibiu",
        sourceLink: "https://example.com/patiserie-bio-sibiu",
        contactName: "Maria Dumbravă",
        contactEmail: "maria@exemplu.ro",
        contactConsent: true,
        status: "converted_to_article"
      },
      {
        title: "Accident feroviar evitat de un mecanic",
        description: "Un mecanic de locomotivă a oprit trenul la timp înainte de o coliziune. Din fericire nimeni nu a murit și trenul a ajuns cu bine în stație.",
        category: "Romania buna",
        location: "Ploiești",
        sourceLink: "https://example.com/accident-evitat-ploiesti",
        contactName: "Sorin Marin",
        contactEmail: "sorin@exemplu.ro",
        contactConsent: true,
        status: "rejected",
        aiAnalysis: JSON.stringify({
          isPositive: false,
          hasSources: true,
          needsClarification: false,
          clarificationQuestion: "Subiectul provine dintr-un incident de risc major (accident feroviar evitat). Chiar dacă finalul este fericit, evenimentul central este negativ și generează frică/panică. Respins conform politicii editoriale."
        })
      },
      {
        title: "Atelier de pictură pe lemn tradițional pentru copii",
        description: "Organizăm ateliere în muzeul satului din Sibiu unde copiii învață gratuit să picteze icoane și lăzi de zestre tradiționale.",
        category: "Cultura & evenimente",
        location: "Sibiu",
        sourceLink: "https://example.com/ateliere-lemn-muzeul-satului",
        contactName: "Elena Sandu",
        contactEmail: "elena@exemplu.ro",
        contactConsent: true,
        status: "submitted"
      }
    ]
  });

  // 6. Creare 10 Abonați Newsletter demo
  await prisma.newsletterSubscriber.createMany({
    data: [
      { email: "cititor1@exemplu.ro", source: "website", status: "active" },
      { email: "cititor2@exemplu.ro", source: "website", status: "active" },
      { email: "cititor3@exemplu.ro", source: "website", status: "active" },
      { email: "cititor4@exemplu.ro", source: "website", status: "active" },
      { email: "cititor5@exemplu.ro", source: "website", status: "active" },
      { email: "cititor6@exemplu.ro", source: "website", status: "active" },
      { email: "cititor7@exemplu.ro", source: "website", status: "active" },
      { email: "cititor8@exemplu.ro", source: "website", status: "active" },
      { email: "dezabonat@exemplu.ro", source: "website", status: "unsubscribed" },
      { email: "newsletter-test@exemplu.ro", source: "admin", status: "active" }
    ]
  });

  // 7. Creare 5 Donații demo Pro
  await prisma.donation.createMany({
    data: [
      {
        amount: 25,
        currency: "EUR",
        email: "donator.generos@exemplu.ro",
        name: "Andrei Codruț",
        isPublic: true,
        status: "completed",
        isFounder: false,
        providerId: "ch_mock_1"
      },
      {
        amount: 50,
        currency: "EUR",
        email: "fondator1@exemplu.ro",
        name: "Cătălin Miron",
        isPublic: true,
        status: "completed",
        isFounder: true,
        providerId: "ch_mock_2"
      },
      {
        amount: 15,
        currency: "EUR",
        email: "donator.anonim@exemplu.ro",
        name: "Anonim",
        isPublic: false,
        status: "completed",
        isFounder: false,
        providerId: "ch_mock_3"
      },
      {
        amount: 100,
        currency: "EUR",
        email: "fondator2@exemplu.ro",
        name: "Elena Grozavu",
        isPublic: true,
        status: "completed",
        isFounder: true,
        providerId: "ch_mock_4"
      },
      {
        amount: 5,
        currency: "EUR",
        email: "donator.mic@exemplu.ro",
        name: "Vali Stoica",
        isPublic: true,
        status: "completed",
        isFounder: false,
        providerId: "ch_mock_5"
      }
    ]
  });

  // 8. Creare 3 Membri (Abonamente) recurenți
  await prisma.member.createMany({
    data: [
      {
        email: "membru.activ@exemplu.ro",
        name: "Robert Pârvu",
        isPublic: true,
        status: "active",
        plan: "monthly_5",
        providerId: "sub_mock_1"
      },
      {
        email: "membru.premium@exemplu.ro",
        name: "Dana Ionescu",
        isPublic: true,
        status: "active",
        plan: "monthly_10",
        providerId: "sub_mock_2"
      },
      {
        email: "membru.anulat@exemplu.ro",
        name: "Gheorghe Stan",
        isPublic: false,
        status: "canceled",
        plan: "monthly_3",
        providerId: "sub_mock_3"
      }
    ]
  });

  // 9. Analytics events logs mock
  await prisma.analyticsEvent.createMany({
    data: [
      { eventType: "view", category: "educatie", source: "Google" },
      { eventType: "view", category: "mediu", source: "Facebook" },
      { eventType: "view", category: "tech-inovatie", source: "LinkedIn" },
      { eventType: "view", category: "romania-buna", source: "Direct" },
      { eventType: "view", category: "educatie", source: "Google" },
      { eventType: "share", category: "mediu" },
      { eventType: "newsletter_subscribe" },
      { eventType: "donation" }
    ]
  });

  console.log("Database seeded successfully with all Pro demo data!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
