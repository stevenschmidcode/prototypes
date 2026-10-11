# baden. – Dein persönlicher Stadtbegleiter

**Deine Stadt. Dein Aufenthalt.** – MVP 0.1 «Mein Aufenthalt»

Ein zweisprachiger Reiseführer als Progressive Web App (Deutsch/Englisch) für Besucherinnen und Besucher von Baden (Aargau): besondere Orte entdecken, kuratierte Thementouren («Reiseprofile») erleben, Favoriten merken, die Unterkunft hinterlegen und den Aufenthalt Tag für Tag planen – ohne Registrierung.

> Unabhängiger Prototyp. Keine offizielle App der Stadt Baden oder von Baden Tourismus.

| Dokument | Inhalt |
| --- | --- |
| [PRODUCT.md](PRODUCT.md) | Produktvision, Zielgruppen, Funktionsumfang, Inhalte |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Architektur, Datenmodell, Sicherheit, technische Entscheidungen |
| [ROADMAP.md](ROADMAP.md) | Nächste Schritte und bewusste Nicht-Ziele |

---

## Voraussetzungen

- **Node.js** ≥ 22 (entwickelt mit 24)
- **pnpm** ≥ 10 (`corepack enable`)
- **Docker** (für die lokale PostgreSQL-Datenbank) – alternativ eine eigene PostgreSQL-Instanz ≥ 15

## Installation

```bash
pnpm install          # installiert Abhängigkeiten und generiert den Prisma-Client
cp .env.example .env  # Umgebungsvariablen anlegen
```

## Datenbank

```bash
pnpm db:up            # startet PostgreSQL 17 in Docker (Port 5433)
pnpm db:migrate       # wendet Migrationen an (Entwicklung)
pnpm db:seed          # lädt Stadt, Kategorien, 39 Orte, 8 Unterkünfte und 6 Thementouren (de/en)
```

Weitere Befehle:

| Befehl | Zweck |
| --- | --- |
| `pnpm db:deploy` | Migrationen in Produktion anwenden (ohne Prompt) |
| `pnpm db:reset` | Datenbank leeren, Migrationen und Seed neu ausführen |
| `pnpm db:studio` | Prisma Studio (Datenbank-Browser) |
| `pnpm db:purge` | Abgelaufene Gastdaten (> 180 Tage inaktiv) löschen – täglich als Cron-Job ausführen |

Der Seed ist idempotent und kann jederzeit erneut ausgeführt werden. Die Inhalte stammen aus [`prisma/seed-data/`](prisma/seed-data/):

| Datei | Inhalt |
| --- | --- |
| `catalog.json` | Orte, Unterkünfte, Bildnachweise – Deutsch, mit Quellen pro Eintrag |
| `catalog.en.json` | Englische Übersetzungen der Orte und Unterkünfte |
| `journeys.json` | Thementouren mit Stationen und Erzähltexten (de/en) |

## Entwicklungsserver

```bash
pnpm dev              # http://localhost:3000
```

Sprachen: Deutsch ohne Präfix (`/entdecken`), Englisch unter `/en` (`/en/entdecken`). Auf dem Desktop (≥ 1024 px) zeigt `/` die Website-Tour mit der App im Telefon. Mobile siehst du direkt die App (zum Testen im Browser: DevTools → Mobile-Ansicht).

Der Service Worker wird nur im Produktionsmodus registriert.

## Tests

| Befehl | Umfang |
| --- | --- |
| `pnpm test` | Unit-Tests (Vitest): Datum/Zeitzone, Reisezeitraum, Konflikterkennung, Validierung, Favoriten, Suche, Wörterbücher (gleiche Schlüssel/Platzhalter in de/en) |
| `pnpm test:integration` | Integrationstests gegen PostgreSQL: Aufenthalt, Unterkunft, Agenda, Favoriten, Thementouren, mehrsprachige Inhalte, Ownership, Löschung. Legt automatisch die Datenbank `baden_test` an. |
| `pnpm test:e2e` | Playwright auf Smartphone- (Pixel 7) und Desktop-Viewport, gegen einen Produktions-Build auf Port 3200 – inklusive axe-core-Prüfung (WCAG 2.2 AA), englischem Durchlauf und Überlauf-Prüfung auf Mobile |
| `pnpm test:a11y` | Nur die Accessibility-Prüfungen |
| `pnpm check` | Lint + Typecheck + Unit-Tests |

Einmalig vor den E2E-Tests: `pnpm exec playwright install chromium`.
Gegen einen bereits laufenden Server: `E2E_BASE_URL=http://localhost:3000 pnpm test:e2e`.

## Build

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm start            # http://localhost:3000
```

Der Build benötigt **keine** Datenbank: Alle Datenzugriffe passieren zur Request-Zeit (siehe ARCHITECTURE.md → Rendering).

## Umgebungsvariablen

| Variable | Pflicht | Beschreibung |
| --- | --- | --- |
| `DATABASE_URL` | ja | PostgreSQL-Verbindung, z. B. `postgresql://user:pass@host:5432/baden?schema=public` |
| `NEXT_PUBLIC_SITE_URL` | nein | Öffentliche Basis-URL für Metadaten (Standard: `http://localhost:3000`) |
| `TEST_DATABASE_URL` | nein | Datenbank für Integrationstests (Name muss «test» enthalten) |
| `E2E_BASE_URL` / `E2E_PORT` | nein | Ziel bzw. Port der E2E-Tests |

Es gibt keine Secrets im Repository. `.env` ist in `.gitignore` ausgeschlossen.

## Deployment-Hinweise

- **Laufzeit:** Node.js-Server (`pnpm build && pnpm start`). Cache Components benötigen die Node.js-Runtime (keine Edge-Runtime).
- **Datenbank:** verwaltetes PostgreSQL (z. B. in der Schweiz gehostet, um Datenübermittlungen ins Ausland zu vermeiden). Vor jedem Release `pnpm db:deploy`, beim ersten Release zusätzlich `pnpm db:seed`.
- **HTTPS ist Pflicht:** In Produktion heisst das Gast-Cookie `__Host-baden_guest` und ist `Secure` – ohne HTTPS funktioniert das Speichern nicht.
- **Cron-Job:** `pnpm db:purge` täglich ausführen (Speicherbegrenzung gemäss Datenschutzerklärung).
- **Plattformen:** Vercel (mit Postgres-Add-on) oder ein Container (z. B. Infomaniak, Exoscale, Fly.io) mit `next start`. Bei mehreren Instanzen ist kein Sticky-Session-Routing nötig – der Zustand liegt vollständig in der Datenbank.
- **Header:** CSP, `X-Frame-Options`, `Referrer-Policy` und `Permissions-Policy` setzt die App selbst (`next.config.ts`).

## Projektstruktur

```
prisma/              Schema, Migrationen, Seed und Seed-Daten (catalog.json)
public/              Bilder (Wikimedia Commons), PWA-Icons, Service Worker
scripts/             Icon-Generator, Löschjob
src/app/[lang]/      Seiten (de/en), Layout, Fehler- und 404-Seite
src/app/             Server Actions, API-Routen, Manifest
src/i18n/            Sprachkonfiguration, Wörterbücher (de/en), Übersetzungshelfer
src/proxy.ts         Sprach-Routing (unpräfixiert → /de intern, /de → kanonische URL)
src/components/      UI-Komponenten (ui/ = shadcn/ui)
src/lib/             Reine Domänenlogik: Datum, Agenda, Validierung, Katalog – ohne Abhängigkeit zu Server/DB
src/server/          Datenbank, Gast-Session, Services (mit Ownership-Prüfung)
tests/               unit/, integration/, e2e/
```

## Bildnachweise

Alle Fotos stammen von Wikimedia Commons (CC BY / CC BY-SA). Die vollständigen Angaben stehen in der App unter `/bildnachweise` und in `prisma/seed-data/catalog.json`.
