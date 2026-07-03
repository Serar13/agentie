# Donații, Membership și Integrare Stripe

Platforma funcționează fără publicitate comercială, fiind susținută exclusiv prin donații de la cititori și membership recurent.

---

## 1. Tipuri de Susținere
* **Donație Unică**: Utilizatorul alege o sumă standard (5 EUR, 10 EUR, 25 EUR, 50 EUR) sau introduce o sumă personalizată.
* **Membership Recurent (Abonament Lunar)**:
  * **Membru Susținător**: 3 EUR / lună
  * **Membru Activ**: 5 EUR / lună
  * **Membru Premium (Fondator)**: 10 EUR / lună

---

## 2. Campania „100 Susținători Fondatori”
Pentru a atrage primii cititori de bază, platforma are integrată o campanie specială:
* Cititorii care optează pentru calitatea de fondator sunt înregistrați cu `isFounder: true`.
* În sidebar-ul paginii `/sustine` este afișat un **Progress Bar** dinamic conectat la baza de date, indicând progresul până la atingerea obiectivului de 100 de fondatori.
* Dacă utilizatorul își exprimă acordul (`isPublic: true`), numele său este afișat public în lista de mulțumiri a fondatorilor.

---

## 3. Integrare Stripe și Mod de Test Local

### Configurare Stripe (.env)
Pentru a accepta plăți reale, trebuie configurate următoarele chei în `.env`:
```env
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_MONTHLY_3="price_..."
STRIPE_PRICE_MONTHLY_5="price_..."
STRIPE_PRICE_MONTHLY_10="price_..."
```

### Mod de Test / Simulare (Fără chei API)
* Dacă variabilele Stripe lipsesc, platforma rulează în **Modul de Simulare**.
* Pagina `/sustine` va afișa o alertă informativă galbenă.
* Trimiterea formularului va genera un flux de checkout simulat, care redirecționează utilizatorul direct către pagina `/sustine/success?payment_mock_success=true`.
* În baza de date locală SQLite vor fi create înregistrări valide de donatori (`Donation`) sau membri (`Member`), permițându-ți să vezi funcționarea interfețelor administrative și a progress bar-ului local, cu **zero costuri**.
