# Agent Pipeline

Pipeline-ul este modular si optimizat pentru cost mic.

## 1. Source Scanner

Citeste RSS si surse manuale. Creeaza drafturi si evita duplicatele prin `originalUrl`.

## 2. Positive Filter

Ruleaza pe model ieftin. Respinge automat subiectele negative si calculeaza `positive_score`.

## 3. Research Agent

Extrage fapte si verifica daca exista minimum 1-3 surse.

## 4. Fact Check Agent

Compara sursele, semnaleaza contradictii si calculeaza `confidence_score`.

## 5. Writer Agent

Scrie draftul doar din fapte disponibile. Fara clickbait.

## 6. Editor Agent

Curata tonul, elimina formularile promotionale si pastreaza factualitatea.

## 7. SEO & Social Agent

Genereaza titlu, subtitlu, slug, meta description, social copy si newsletter blurb.

## 8. Quality Gate

Decide `approved`, `needs_review` sau `rejected`. Nu seteaza niciodata automat `published`.
