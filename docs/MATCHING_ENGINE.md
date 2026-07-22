# ScentScout — Matching Engine

Turns a normalized `ParsedRetailerProduct` into a decision: match to a canonical
`product_variant`, send to manual review, or leave unmatched/rejected. **Deterministic checks
approve production matches.** An LLM may only *suggest* a candidate for human review — never
auto-approve.

## Normalize

Normalize brand, fragrance name, flanker, concentration, size, presentation, and condition
before comparison, using explicit alias dictionaries and unit conversion. Examples:

```
EDP                         -> eau_de_parfum
Eau de Parfum Spray         -> eau_de_parfum
EDT                         -> eau_de_toilette
3.4 oz                      -> 100 ml
3.3 oz                      -> ~100 ml
NIB                         -> new retail presentation
Tester Box                  -> tester
Recharge                    -> refill
Maison Francis Kurkdjian    -> MFK
Parfums de Marly            -> PDM
LeLabo                      -> Le Labo
```

Preserve the original source evidence alongside the normalized values.

## Contradiction checks (auto-reject)

Reject automatic matching when any of these hold:

- Brand contradicts the canonical product.
- Flanker contradicts the canonical product.
- Concentration contradicts the canonical product.
- Size contradicts the canonical product.
- A **tester** is being matched to a **retail** bottle.
- A **refill** is being matched to a **complete** bottle.
- A **gift set** is being matched to an **individual** bottle.
- A **body product** is being matched to a **fragrance**.
- Required attributes are missing or ambiguous.

## Confidence scoring

Suggested weights (additive; any contradiction ⇒ reject):

```
Brand exact:          +0.25
Fragrance exact:      +0.30
Flanker exact:        +0.15
Concentration exact:  +0.10
Size exact:           +0.10
Presentation exact:   +0.10
Contradiction:        reject
```

Suggested thresholds → `match_status`:

```
0.95–1.00 : exact         (automatic match)
0.80–0.94 : manual_review
< 0.80    : unmatched / rejected
```

## Audit trail

Every matching decision records an auditable list of reasons (which signals matched, which
contradicted, the method, and the resulting confidence), stored so admins can review and correct
matches through tools rather than editing the database. Uncertain cases create `match_reviews`
entries.

> Changing thresholds, weights, or introducing an LLM into the match path requires an ADR in
> `docs/DECISIONS.md`.
