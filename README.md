# Positive News Agency

MVP pentru o agentie/canal de stiri pozitive: fara reclame, fara panica, doar vesti bune, verificate.

Publicarea nu este automata. Pipeline-ul poate muta un articol pana la `approved`, dar un om trebuie sa apese manual `published` in admin.

## Stack

- Next.js + React + TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite local pentru MVP
- RSS feeds + surse manuale
- Provider AI abstract pentru OpenAI, Gemini, Anthropic si DeepSeek

## Pornire rapida (SQLite fallback - Fara Firebase necesar)

Implicit, aplicatia este configurata sa ruleze local folosind **SQLite si Prisma** ca data provider (`DATA_PROVIDER="sqlite"`), fara sa necesite nicio credențiala sau conexiune la Firebase.

```bash
cd ~/Developer/positive-news-agency
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Aplicatia ruleaza implicit la `http://localhost:3000`.

## Configurare `.env`

```bash
# Alege "sqlite" pentru dev local simplu, sau "firebase" pentru emulatoare / productie
DATA_PROVIDER="sqlite"
DATABASE_URL="file:../db/dev.db"

# Daca folosesti DATA_PROVIDER="firebase" local, alege una din optiuni:
# 1. Firebase Local Emulator:
# FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
# 2. Service Account Real:
# FIREBASE_SERVICE_ACCOUNT_JSON='{...}'

OPENAI_API_KEY=""
GEMINI_API_KEY=""
ANTHROPIC_API_KEY=""
DEEPSEEK_API_KEY=""

DEFAULT_CHEAP_MODEL="gpt-4o-mini"
DEFAULT_WRITER_MODEL="gpt-4o-mini"
DEFAULT_EDITOR_MODEL="gpt-4o"
DEFAULT_FACTCHECK_MODEL="gpt-4o-mini"

MODEL_PROVIDER="mock"
MONTHLY_BUDGET_EUR="100"
TARGET_MONTHLY_ARTICLES="525"
```

`MODEL_PROVIDER="mock"` tine costurile la zero si permite testarea fluxului fara chei API. Pentru productie seteaza `openai`, `gemini`, `anthropic` sau `deepseek` si completeaza cheia respectiva.

## Testare cu Firebase Emulator local

Daca vrei sa testezi comportamentul specific de Firebase local:
1. Porneste emulatoarele intr-un terminal separat:
   ```bash
   npx firebase emulators:start
   ```
2. In `.env`, seteaza:
   ```bash
   DATA_PROVIDER="firebase"
   FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
   ```
3. Porneste serverul Next.js: `npm run dev`. Firebase Admin se va conecta automat la emulator fara sa aiba nevoie de credențiale reale.


## Comenzi

```bash
npm run dev
npm run build
npm run lint
npm run db:migrate
npm run db:seed
npm run scan:sources
npm run generate:news
npm run cost:report
```

`scan:sources` citeste feed-urile active si creeaza articole `draft`. `generate:news` ruleaza pipeline-ul pentru drafturi si le muta in `approved`, `needs_review` sau `rejected`.

## Cum adaugi surse RSS

1. Porneste aplicatia si seed-ul.
2. Adauga surse direct in tabela `Source` prin Prisma Studio sau printr-un script intern.
3. Modelul sursei este:

```json
{
  "name": "Good News Network",
  "type": "rss",
  "url": "https://www.goodnewsnetwork.org/feed/",
  "isActive": true
}
```

Exemplele sunt in `config/sources.example.json`.

## Cum rulezi pipeline-ul

```bash
npm run scan:sources
npm run generate:news
```

Sau din admin, pe un articol, foloseste butonul `Pipeline`.

Agentii sunt modulari:

1. Source Scanner
2. Positive Filter
3. Research Agent
4. Fact Check Agent
5. Writer Agent
6. Editor Agent
7. SEO & Social Agent
8. Quality Gate

Prompturile sunt in `prompts/`.

## Statusuri

- `draft`: capturat sau incomplet
- `needs_review`: are surse/scoruri insuficiente
- `approved`: a trecut gate-ul, dar nu este public
- `published`: vizibil public
- `rejected`: respins editorial

Regula importanta: `published` este blocat daca articolul nu a fost `approved` inainte.

## Costuri

Dashboard-ul admin afiseaza costul pe zi, pe luna si media per articol. Scriptul:

```bash
npm run cost:report
```

Tinta MVP:

- maximum 100 EUR/luna
- 450-600 articole/luna
- 0.16-0.22 EUR/articol

## Newsletter

Formularul public salveaza emailurile in `NewsletterSubscriber`. Este pregatit pentru un newsletter zilnic: `5 vesti bune in 5 minute`.

## Donatii si membership

Pagina `/support` include:

- donatii unice: 5 EUR, 10 EUR, 25 EUR
- membership lunar: 3 EUR, 5 EUR, 10 EUR

Stripe nu este conectat in MVP, dar `.env.example` include campurile necesare pentru integrare.

## Structura folderelor

```text
app/          rute publice si admin
components/   componente UI
lib/          Prisma, actiuni server-side, constante
agents/       pipeline AI modular
services/     RSS, cost tracking, news queries
db/           SQLite local
prompts/      prompturi pentru agenti
scripts/      scanare, generare, raport costuri
config/       exemple de surse
docs/         documentatie editoriala si tehnica
prisma/       schema si seed
```

## Note pentru productie

- Demo data este marcata explicit cu `DEMO` si nu trebuie tratata ca stire reala.
- Adauga autentificare inainte de a expune `/admin` public.
- Activeaza un provider AI real doar dupa ce ai limite de cost si logging.
- Nu publica articole fara surse verificabile.
