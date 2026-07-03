# Sistemul de Newsletter: „5 Vești Bune în 5 Minute”

Newsletterul nostru oferă abonaților un rezumat curat, rapid și lipsit de reclame, trimis direct pe email.

---

## 1. Experiența Abonaților
* **Abonare**: Formular public prezent pe homepage și pe paginile de articole.
* **Dezabonare**: Link unic inclus la finalul fiecărui email, direcționând către pagina `/unsubscribe?email=...`, care actualizează statusul abonatului în baza de date la `unsubscribed`.
* **Fără Reclame**: Newsletterul are un design axat exclusiv pe text, ușor de citit pe telefonul mobil, conținând cele 5 titluri ale zilei și un scurt mesaj de susținere pentru membership.

---

## 2. Fluxul Administrativ
Editorul uman are control total asupra conținutului trimis:
1. **Alegerea Articolelor**: Din panoul `/admin/newsletter`, editorul poate alege dintr-o listă de articole aprobate sau publicate exact cele 5 știri pe care dorește să le trimită.
2. **Generare Preview**: Sistemul compilează automat codul HTML al email-ului (folosind template-ul premium din `services/newsletter-service.ts`) și îl afișează în mod interactiv în dashboard.
3. **Trimitere Campaign**: La apăsarea butonului „Trimite acum”, sistemul parcurge toți abonații activi și le trimite email-ul personalizat.

---

## 3. Integrare Provider Email
Pentru trimiterea efectivă a email-urilor, poți configura o cheie API pentru **Resend** (implicit) sau alt serviciu (SendGrid / Mailgun) în fișierul `.env`:

```env
RESEND_API_KEY="re_your_api_key"
```

* **Modul de Test (Fără cheie API)**: Dacă variabila `RESEND_API_KEY` este goală sau lipsă, sistemul va rula în **Mock Mode**. Campaniile vor simula trimiterea cu succes, scriind logurile în consola serverului (`[Mock Send] To: email@exemplu.ro, Subject: ...`), fără a consuma bani sau resurse.
