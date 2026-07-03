# Controlul Costurilor și Managementul Bugetului AI

Aplicația este optimizată pentru a asigura un control extrem de riguros al costurilor de operare AI, respectând obiectivul de **100 EUR / lună** pentru operarea agenților.

---

## 1. Monitorizarea Costurilor
Fiecare rulare a unui agent AI este estimată pe baza numărului de tokeni de intrare și ieșire și a prețului specific modelului respectiv (salvat în `services/cost-tracker.ts`). 
Datele de cost sunt salvate în tabela `CostLog` din SQLite și sunt agregate în timp real:
* **Cost azi**: Suma costurilor pe ziua curentă.
* **Cost lună**: Suma costurilor pe luna curentă.
* **Cost mediu per articol**: Costul total lunar împărțit la numărul de articole publicate.

---

## 2. Alerte și Bariere Automate (Cost Safety Guardian)

### A. Blocaj Automat (Hard Stop)
La începutul fiecărui pipeline, funcția `checkBudgetLimits()` verifică costurile totale din baza de date:
* Dacă **Cost lună >= MONTHLY_BUDGET_EUR** (implicit 100 EUR) sau **Cost azi >= DAILY_BUDGET_EUR** (implicit 5 EUR), procesarea este blocată instant.
* Articolul este salvat în starea `needs_review` cu nota: *"Procesare blocată automat de gardianul de costuri: Bugetul lunar/zilnic a fost atins."*
* Niciun apel API nu mai este trimis către serverele AI, prevenind depășirea nedorită a bugetului.

### B. Downgrade Automat de Model (Soft Limit)
* Dacă consumul lunar atinge sau depășește **70% din bugetul lunar** (ex. 70 EUR), sistemul activează automat modul `AI_BUDGET_DOWNGRADE`.
* Când acest mod este activ, **toți agenții sunt redirecționați să folosească cel mai ieftin model disponibil** (cum ar fi `gpt-4o-mini` sau `gemini-1.5-flash`), indiferent de importanța task-ului. Acest comportament reduce costurile cu peste 90% pentru restul lunii.

---

## 3. Optimizări prin Caching
* **Scan Cache**: Rezultatele scanării feed-urilor RSS sunt stocate în tabela `ScanCache` timp de 30 de minute. Dacă se cere scanarea repetată a aceleiași surse, articolele sunt citite din cache, evitând fetch-uri repetate și încărcarea serverelor externe.
* **Duplicate Detection**: Înainte de a crea un draft de articol din RSS, sistemul verifică dacă `originalUrl` există deja în baza de date. Dacă da, articolul este ignorat direct, fără a cheltui resurse sau a lansa agenții AI.
