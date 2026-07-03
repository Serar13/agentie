# Cost Model

Buget tinta: 100 EUR/luna.

Target editorial:

- 15-20 stiri pozitive/zi
- 450-600 stiri/luna
- cost mediu tinta: 0.16-0.22 EUR/stire

## Routing modele

- `cheap`: scanare, filtrare, titluri simple
- `writer`: drafturi
- `factcheck`: research si verificare
- `editor`: polish doar pentru materiale importante

## Tracking

Fiecare agent scrie in `CostLog`:

- tokens input
- tokens output
- model
- cost estimat
- data

Raport:

```bash
npm run cost:report
```
