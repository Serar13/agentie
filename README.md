# Positive News Agency

MVP pentru o agentie/canal de stiri pozitive: fara reclame, fara panica, doar vesti bune, verificate.

Publicarea nu este automata. Pipeline-ul poate muta un articol pana la `approved`, dar un om trebuie sa apese manual `published` in admin.

## Stack

- Next.js + React + TypeScript
- Tailwind CSS
- Firebase Firestore (singura bază de date, inclusiv local prin emulator)
- RSS feeds + surse manuale
- Provider AI abstract pentru OpenAI, Gemini, Anthropic si DeepSeek

## Pornire rapida (Conexiune Firebase locala)

Aplicația rulează exclusiv pe **Firebase Firestore**. Nu există nicio bază de date locală alternativă. Pentru a porni local, urmează acești pași:

1. Creează fișierul `.env` din `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Configurează credențialele în `.env` folosind una din cele două opțiuni:
   - **Opțiunea A (Recomandată - Fără chei reale):** Folosește Firebase Local Emulator. Rulează `npx firebase emulators:start --only firestore` în alt terminal și activează `FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"` în `.env`. Necesită Java instalat local (cerință a emulatorului Firestore).
   - **Opțiunea B:** Descarcă cheia privată Service Account din Firebase Console și seteaz-o ca `FIREBASE_SERVICE_ACCOUNT_JSON='{...}'`.
3. Instalează dependențele:
   ```bash
   npm install
   ```
4. Porneste serverul de development Next.js:
   ```bash
   npm run dev
   ```

Aplicația rulează implicit la `http://localhost:3000`.

> [!NOTE]
> **Seeding automat:** La prima deschidere a paginii în browser (sau primul request), sistemul va detecta dacă baza de date Firestore este goală și va insera automat categoriile inițiale, sursele RSS implicite, conturile administrative de test și articolele demo de pornire. Nu este necesar un script separat de seed.

## Configurare `.env`

```bash
# Alege una din cele două opțiuni pentru Firebase local:
# Opțiunea A: Emulatorul local Firestore
FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"

# Opțiunea B: Conexiune reală Firebase
# FIREBASE_SERVICE_ACCOUNT_JSON='{ ...JSON-ul descarcat din consola Firebase... }'

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

`MODEL_PROVIDER="mock"` ține costurile la zero și permite testarea fluxului fără chei API. Pentru producție setează `openai`, `gemini`, `anthropic` sau `deepseek` și completează cheia respectivă.



## Comenzi

```bash
npm run dev
npm run build
npm run lint
npm run scan:sources
npm run generate:news
npm run cost:report
```

`scan:sources` citeste feed-urile active si creeaza articole `draft`. `generate:news` ruleaza pipeline-ul pentru drafturi si le muta in `approved`, `needs_review` sau `rejected`.

## Cum adaugi surse RSS

1. Porneste aplicatia (seeding-ul in Firestore se face automat la primul request).
2. Adauga surse direct din `/admin/sources` sau in colectia `sources` din Firestore.
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

Formularul public salveaza emailurile in colectia Firestore `newsletterSubscribers`. Este pregatit pentru un newsletter zilnic: `5 vesti bune in 5 minute`.

## Donatii si membership

Pagina `/support` include:

- donatii unice: 5 EUR, 10 EUR, 25 EUR
- membership lunar: 3 EUR, 5 EUR, 10 EUR

Stripe nu este conectat in MVP, dar `.env.example` include campurile necesare pentru integrare.

## Structura folderelor

```text
app/          rute publice si admin
components/   componente UI
lib/          actiuni server-side, constante, Firebase Admin
agents/       pipeline AI modular
services/     RSS, cost tracking, news queries, Firestore store
prompts/      prompturi pentru agenti
scripts/      scanare, generare, raport costuri
config/       exemple de surse
docs/         documentatie editoriala si tehnica
```

## Note pentru productie

- Demo data este marcata explicit cu `DEMO` si nu trebuie tratata ca stire reala.
- Adauga autentificare inainte de a expune `/admin` public.
- Activeaza un provider AI real doar dupa ce ai limite de cost si logging.
- Nu publica articole fara surse verificabile.
