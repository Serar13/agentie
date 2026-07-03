# Ghid de Deployment și Configurare Producție

Acest ghid oferă instrucțiuni pas cu pas pentru mutarea proiectului de la dezvoltarea locală către producție.

---

## 1. Variabile de Mediu in Producție (.env)
În serverul de producție (ex. Vercel, Netlify, VPS), trebuie configurate următoarele variabile:

```env
# Baza de date
DATABASE_URL="file:./db/dev.db" # Sau un server PostgreSQL/MySQL la alegere

# Configurare Modele AI (pentru apeluri reale)
MODEL_PROVIDER="openai" # "openai" | "gemini" | "anthropic" | "deepseek"
OPENAI_API_KEY="sk-proj-..."
GEMINI_API_KEY="..."
DEFAULT_CHEAP_MODEL="gpt-4o-mini"
DEFAULT_WRITER_MODEL="gpt-4o-mini"
DEFAULT_EDITOR_MODEL="gpt-4o"
DEFAULT_FACTCHECK_MODEL="gpt-4o-mini"

# Limite Buget AI
MONTHLY_BUDGET_EUR="100"
DAILY_BUDGET_EUR="5"

# Plati Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_MONTHLY_3="price_..."
STRIPE_PRICE_MONTHLY_5="price_..."
STRIPE_PRICE_MONTHLY_10="price_..."

# Email (Resend)
RESEND_API_KEY="re_..."

# Securitate Sesiuni
SESSION_SECRET="o-cheie-lunga-si-securizata-generata-aleatoriu"
NEXT_PUBLIC_APP_URL="https://vestibune.ro"
```

---

## 2. Firebase Hosting / App Hosting

Aplicația este Next.js cu server-side actions, Prisma și admin. Pentru varianta completă live pe Firebase, folosește **Firebase App Hosting**, nu doar Firebase Hosting static.

Configurația adăugată în proiect:

- `.firebaserc` leagă repo-ul de proiectul `positivenews-c6511`.
- `apphosting.yaml` ține costul de idle la zero cu `minInstances: 0` și limitează MVP-ul la `maxInstances: 2`.
- `firebase.json` leagă regulile de Storage.
- `storage.rules` permite doar citirea imaginilor publice din `article-images/` și blochează upload-ul direct din browser.

Status actual: backendul Firebase App Hosting este creat și live:

`https://positive-news-agency--positivenews-c6511.us-central1.hosted.app`

Dacă proiectul este încă pe Spark, App Hosting nu poate fi activat. Firebase cere upgrade la Blaze pentru a activa API-ul de App Hosting. După upgrade, backendul a fost creat în `us-central1`:

```bash
firebase apphosting:backends:create \
  --project positivenews-c6511 \
  --backend positive-news-agency \
  --primary-region us-central1 \
  --root-dir .
```

Deploy-ul local se face din folderul proiectului:

```bash
firebase deploy --only apphosting:positive-news-agency --project positivenews-c6511 --force
```

`NEXT_PUBLIC_APP_URL` trebuie să rămână setat la URL-ul `hosted.app` sau la domeniul custom, nu la URL-ul `web.app` din Firebase Hosting static.

Pentru control de cost, păstrează `minInstances: 0`, setează bugete/alerte în Google Cloud Billing și lasă `MODEL_PROVIDER="mock"` până când alegi explicit un provider AI.

Storage este necesar doar pentru poze încărcate/editoriale. Imaginile statice din `public/images` sunt incluse în aplicație și nu consumă Firebase Storage. Regulile Storage au fost publicate cu:

```bash
firebase deploy --only storage --project positivenews-c6511
```

Când adăugăm upload real în admin, recomand varianta server-side: adminul încarcă poza prin aplicația Next.js, iar serverul o scrie în Storage cu Firebase Admin SDK. Regulile actuale blochează upload-ul direct pentru a evita costuri și abuz.

Important pentru producție: deploy-ul live curent folosește SQLite de demo generat la build (`file:./db/apphosting.db`). Este suficient pentru preview/live MVP, dar nu trebuie tratat ca stocare permanentă. Pentru live complet, mută `DATABASE_URL` pe PostgreSQL/MySQL/Cloud SQL sau rescrie layer-ul de date pe Firestore.

---

## 3. Pași generali pentru Deployment

### Pasul 1: Sincronizare Schemă Bază de Date
Dacă folosești PostgreSQL sau o altă bază de date în producție, rulează migrarea:
```bash
npx prisma migrate deploy
```
Dacă folosești SQLite local pe server:
```bash
npx prisma db push --accept-data-loss
```

### Pasul 2: Popularea inițială a bazei de date (Seeding)
Pentru a porni cu categoriile implicite create:
```bash
npm run db:seed
```

### Pasul 3: Construirea bundle-ului de producție
Rulează comanda de build pentru a compila codul TypeScript și Next.js:
```bash
npm run build
```

### Pasul 4: Pornirea serverului
Pornește serverul Next.js optimizat:
```bash
npm start
```

---

## 4. Configurare Stripe Webhook
Pentru a recepționa plățile finalizate cu succes, configurează un Webhook în dashboard-ul Stripe care să trimită evenimentele către:
`https://domeniul-tau.ro/api/webhooks/stripe`

Evenimentul necesar pentru abonamente și donații unice este:
* `checkout.session.completed`
