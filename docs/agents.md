# Sistemul Multi-Agent: Roluri și Flux AI

Platforma folosește un flux secvențial de agenți AI pentru a transforma o sursă primară brută (RSS sau propunere cititor) într-un articol premium complet redactat, optimizat pentru SEO și gata de publicare în social media.

---

## 1. Agenții Sistemului

### Pasul 1: Filtru Pozitiv (`positive-filter.ts`)
* **Rol**: Evaluează dacă știrea se încadrează în temele constructive permise și nu conține semnale negative interzise (accidente, decese, violență, partizanat politic).
* **Decizie**: Calculează un scor de pozitivitate. Dacă `positiveScore < 75` sau are cuvinte în blacklist, starea devine automat `rejected`.

### Pasul 2: Cercetare & Extracție (`research-agent.ts`)
* **Rol**: Analizează textul sursei originale și referințele.
* **Decizie**: Extrage o listă clară de fapte verificate (verifiedFacts) și o listă de întrebări deschise sau detalii care lipsesc (openQuestions).

### Pasul 3: Fact-Checking (`fact-check-agent.ts`)
* **Rol**: Verifică conformitatea textului cu sursele, depistează eventualele exagerări comerciale sau contradicții.
* **Decizie**: Calculează scorul de încredere (confidenceScore). Dacă există contradicții flagrante, scorul scade dramatic.

### Pasul 4: Scriitor (`writer-agent.ts`)
* **Rol**: Redactează articolul în limba română pe baza faptelor certe extrase de agentul de cercetare.
* **Decizie**: Generează titlul descriptiv, subtitlul, lead-ul de impact și textul structurat pe paragrafe (separat prin diacritice corecte).

### Pasul 5: Editor (`editor-agent.ts`)
* **Rol**: Elimină cuvintele promoționale sau senzaționaliste reziduale (ex: „revoluționar”, „miraculos”) pentru a asigura un ton elegant și sobru.

### Pasul 6: SEO & Social Media Engine (`seo-social-agent.ts`)
* **Rol**: Generează pachetul SEO (meta titlu, descriere, slug) și pachetul social media (postări Facebook, Instagram, LinkedIn, scripturi TikTok și YouTube Shorts, hashtags, video hooks).

### Pasul 7: Quality Gate (`quality-gate.ts`)
* **Rol**: Agentul de audit final. Evaluează calitatea surselor, originalitatea rescrierii și acordă notele finale.
* **Decizie**: Dacă `positiveScore < 75` sau `confidenceScore < 80`, marchează articolul ca `needs_review` sau `rejected`. Dacă trece de toate criteriile, marchează starea articolului ca `approved`.

---

## 2. Rularea în Modul Mock
Dacă `MODEL_PROVIDER="mock"`, agenții nu fac apeluri la API-uri reale. Ei folosesc algoritmi pe bază de reguli (keywords matching) și formule matematice pentru a simula rezultatele, permițând rularea locală a aplicației fără card bancar sau credite API.
