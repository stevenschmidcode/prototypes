# Architektur

## Überblick

```
Browser (PWA)
  │  Server Components (HTML-Streaming)      Server Actions (Mutationen)      /api/me/* (private Lesezugriffe)
  ▼
Next.js 16 App Router ──► src/server/session.ts  (Gast-Identität aus HttpOnly-Cookie)
                     └──► src/server/services/*  (Geschäftslogik + Ownership)  ──► Prisma 7 ──► PostgreSQL
                                   │
                                   └── src/lib/*  (reine Domänenlogik: Datum, Agenda, Validierung – auch im Client genutzt)
```

Ein einzelnes Next.js-Projekt ohne Microservices. Die Schichten sind so getrennt, dass die Geschäftslogik ohne Next.js testbar ist (Integrationstests rufen die Services direkt auf).

| Schicht | Verantwortung |
| --- | --- |
| `src/lib` | Reine Funktionen ohne I/O: Kalenderlogik, Konflikterkennung, Zod-Schemas, Suche, Favoritenfilter. Läuft auf Server und Client. |
| `src/server/services` | Alle Datenbankzugriffe. Jede Funktion mit persönlichen Daten erhält die `visitorId` als ersten Parameter und filtert damit. Eingaben werden hier (erneut) mit Zod validiert. |
| `src/server/session.ts` | Einziger Ort, der das Gast-Cookie liest oder setzt. |
| `src/app/actions.ts` | Dünne Server Actions: Identität ermitteln → Service aufrufen → Fehler in nutzerfreundliche Meldungen übersetzen → `refresh()`. |
| `src/app/api/me/*` | Private GET-Endpunkte für Client-Komponenten (Favoriten-IDs, Aufenthalte für den «Hinzufügen»-Dialog, Datenexport). |

## Technologie-Entscheidungen

| Entscheidung | Begründung |
| --- | --- |
| **Next.js 16 mit Cache Components und Partial Prefetching** | Projekt-Default der aktuellen Version. Jede Seite liefert sofort eine statische Shell (Header, Titel, Skeletons), persönliche Daten streamen hinter `<Suspense>` nach. Das wirkt wie eine native App. |
| **Server Actions statt REST für Mutationen** | Next.js prüft dabei automatisch Origin/Host (CSRF-Schutz), retried bei Verbindungsabbruch, und `refresh()` aktualisiert die Ansicht ohne eigenen Client-Cache. |
| **Route Handlers für private Lesezugriffe** | Client-Dialoge (z. B. «Zum Aufenthalt hinzufügen») brauchen die Aufenthalte des Gastes. Die Antworten sind `Cache-Control: private, no-store`. |
| **Prisma 7 mit `@prisma/adapter-pg`** | Typsicheres Schema, Migrationen, aktueller Treiber-Adapter-Ansatz. |
| **Zod 4, ein Schema für Client und Server** | Sofortiges Feedback im Formular, gleiche Regeln als verbindliche Prüfung auf dem Server. |
| **shadcn/ui (Radix) + Tailwind 4** | Barrierearme Primitive (Dialog, Fokus-Management), volle Kontrolle über das Design. Komponenten wurden an das Designsystem angepasst (Touch-Ziele ≥ 44 px, Bottom Sheets auf Mobile). |
| **Kein State-Management-Framework** | Server ist die Quelle der Wahrheit. Einziger Client-Store: Favoriten-IDs (React Context), weil Herz-Buttons überall sofort reagieren sollen. |
| **Handgeschriebener Service Worker** | Wenige, nachvollziehbare Regeln statt einer Blackbox (siehe PWA). |

## Rendering und Caching

- Mit Cache Components muss jeder Zugriff auf Cookies oder die Datenbank hinter `<Suspense>` liegen. Seiten sind deshalb als **statische Shell + gestreamte Datenbereiche** gebaut, die Skeletons sind die Fallbacks.
- `getVisitorId()` ruft `connection()` auf: Persönliche Daten und die davon abhängige «heute»-Logik sind immer Request-Zeit-Daten.
- Katalogabfragen laufen über `src/server/queries.ts` mit `connection()`. Der **Build braucht keine Datenbank**. Der Katalog ist klein (26 Einträge), ein Cache wäre im MVP Optimierung ohne Nutzen. Später: `'use cache'` + `cacheTag('catalog')`.
- Breite `try/catch`-Blöcke rufen `unstable_rethrow()` auf, damit Next.js-interne Steuerfehler (Prerender-Abbruch, `notFound`) nicht verschluckt werden.
- Die Navigation markiert den aktiven Bereich hinter `<Suspense>`, weil das aktive Segment auf dynamischen Routen erst zur Request-Zeit feststeht.
- `notFound()` in gestreamten Bereichen liefert technisch HTTP 200 mit 404-Inhalt (Streaming-Verhalten). Die privaten API-Routen antworten mit echtem 404.

## Mehrsprachigkeit (Deutsch/Englisch)

| Aspekt | Umsetzung |
| --- | --- |
| **Routing** | Alle Seiten liegen unter `app/[lang]`. Deutsch ist Standard und läuft ohne Präfix (`/entdecken`), Englisch unter `/en/…`. `src/proxy.ts` schreibt unpräfixierte Pfade intern auf `/de/…` um und leitet `/de/…` per 308 auf die kanonische URL. `generateStaticParams` rendert beide Sprachen als statische Shell vor. |
| **Sprache im Server** | `getI18n()` liest den Root-Parameter über `next/root-params`; Lade-Funktionen in `src/server/queries.ts` holen sich die Sprache selbst. In Server Actions und Route Handlers (dort gibt es keine Root-Parameter) wird die Sprache ausdrücklich übergeben und validiert. |
| **UI-Texte** | Typisierte Wörterbücher `src/i18n/dictionaries/de.ts` und `en.ts`. Das englische Wörterbuch muss den Typ des deutschen erfüllen, sonst bricht der Build. Ein Unit-Test prüft zusätzlich gleiche Schlüssel, Listenlängen und Platzhalter. Client-Komponenten erhalten das Wörterbuch über `I18nProvider`. |
| **Inhalte** | Grundfelder von `Place`/`Accommodation` sind Deutsch. Übersetzungen liegen in `PlaceTranslation`/`AccommodationTranslation` (je `(id, locale)` eindeutig). Fehlt eine Übersetzung, fällt die App auf Deutsch zurück. Kategorienamen kommen aus dem Wörterbuch. |
| **Validierung** | Zod-Schemas liefern sprachneutrale Meldungsschlüssel (`v.endBeforeStart`, mit Parametern `v.tooLong|80`). `translateMessage()` übersetzt sie in der Oberfläche und formatiert ISO-Daten lokal. Server und Client nutzen weiterhin dasselbe Schema. |
| **Formate** | `de-CH` bzw. `en-GB` für Datum und Dauer, Anführungszeichen «…» bzw. “…”, `<html lang>` und `hreflang`-Alternativen pro Sprache. |

## Thementouren («Reiseprofile»)

- **Modell:** `Journey` (Slug, Icon, Farbthema, Bild) mit `JourneyTranslation` (Titel, Persona, Tagline, Einleitung) und geordneten `JourneyStop`s (Ort, empfohlene Zeit vor Ort) samt `JourneyStopTranslation` («Warum hier?»). `Trip.journeyId` speichert das gewählte Reiseprofil (`SetNull` beim Löschen einer Tour).
- **Inhalte:** `prisma/seed-data/journeys.json`. Die Erzähltexte stützen sich ausschliesslich auf die verifizierten Ortsbeschreibungen.
- **Als Tagesprogramm übernehmen** (`applyJourneyToTrip`): legt alle Stationen ab einer Startzeit mit wählbarem Puffer (0/15/30 Min.) in einer Transaktion an. Stationen, die nach Mitternacht enden würden, entfallen. Überschneidungen mit bestehenden Einträgen werden gemeldet, aber nicht blockiert. Titel und Notizen werden in der gewählten Sprache gespeichert. Die Funktion ist idempotent über `clientRequestId` und prüft Eigentum sowie Reisedaten.
- **Oberfläche:** `/touren` (Übersicht), `/touren/[slug]` (Zeitstrahl, Routenlink zu Fuss, Übernehmen-Dialog mit Live-Vorschau), Reiseprofil-Auswahl beim Erstellen/Bearbeiten eines Aufenthalts (auch per `?profil=…`), Empfehlung im Dashboard, «Teil dieser Touren» auf jeder Ortsseite, eigenes Kapitel in der Desktop-Tour.

## Planungshilfen (regelbasiert, ohne KI)

`src/lib/recommendations.ts` enthält reine, getestete Funktionen. Es gibt keine externen Dienste und keine Wetter-API: Regenwetter wählt der Gast selbst.

- **Tour anpassen:** `scheduleStops` berechnet die Zeiten für ausgewählte Stationen in beliebiger Reihenfolge und Dauer. Der Server übernimmt eine optionale Stationsliste (`stops: [{ stopId, durationMinutes }]`). Er akzeptiert nur Stationen der gewählten Tour, keine Duplikate und keine leere Auswahl.
- **Freie Zeit:** `findFreeSlots` findet Lücken ab 60 Minuten im Tagesfenster 09–21 Uhr, am heutigen Tag erst ab «jetzt».
- **Empfehlungen:** `recommendForSlot` schlägt Orte vor, die in die Lücke passen, noch nicht geplant sind, keine Veranstaltungen sind und bei Regen wetterfest sind.
  - Bonus erhalten Orte des Reiseprofils, Restaurants und Cafés zur Mittagszeit (sofern noch kein Essen geplant ist), Restaurants am Abend und Cafés zur Kaffeepause.
  - Für Abwechslung gibt es zuerst höchstens einen Vorschlag pro Art.
  - Jede Empfehlung trägt ihre Begründung («Passt zu deinem Reiseprofil», «Zeit fürs Mittagessen» …).
- **Bedienung:** In der Tagesansicht der Agenda plant ein Tipp den Vorschlag direkt ein, und der Hinweis bietet «Rückgängig». Öffnungszeiten sind meist nicht verifiziert; die Oberfläche weist darauf hin.

## Website-Tour (Desktop-Startseite)

Aufbau nach dem Vorbild von *Let's Have a Coffee*: Auf dem Desktop (≥ 1024 px) ist `/` eine geführte Tour auf einem Bildschirm, ohne Scrollen. Links stehen die Kapitel, rechts die **echte App in einem Telefon-Rahmen**.

- `src/components/website/website-tour.tsx`: 7 Kapitel (Start, Entdecken, So geht's, Agenda, Favoriten, Installieren, Datenschutz). Runde Tabs mit Countdown-Ring, automatischer Wechsel alle 12 s. Der Wechsel pausiert bei Hover, lässt sich über den Pause-Button stoppen und ist bei `prefers-reduced-motion` aus. Pfeiltasten wechseln das Kapitel. «Demo ausprobieren» holt das Telefon in die Mitte, Esc oder ein Tab führt zurück.
- Das Telefon ist ein iframe derselben App (390 × 844, skaliert auf die Bildschirmhöhe). Weil es schmal ist, zeigt es automatisch das Mobile-Layout. Cookies werden geteilt: Was der Gast im Telefon plant, ist sein echter Aufenthalt.
- `src/components/layout/embed-bridge.tsx`: Die Tour schickt per `postMessage` (nur gleiche Origin) Navigationsbefehle an den Next-Router im iframe, ohne Neuladen. Das iframe meldet Berührungen (dann pausiert die Tour: wer tippt, übernimmt) und die Esc-Taste zurück.
- Das iframe entsteht nur im Browser und nur auf breiten Bildschirmen. Innerhalb eines eingebetteten Fensters rendert die Tour nichts, sonst würde sich die App endlos selbst einbetten. Die Kennzahlen und Highlights stammen aus der Seed-Quelle, der Build braucht also weiterhin keine Datenbank.
- Mobile und alle Unterseiten (z. B. `/entdecken`) auf dem Desktop bleiben die normale App.
- Sicherheit: `X-Frame-Options: SAMEORIGIN` und `frame-ancestors 'self'`. Nur baden. selbst darf die App einbetten.

## Datenmodell

```
City 1─n Place n─1 PlaceCategory
City 1─n Accommodation
City 1─n Trip

VisitorSession 1─n Trip 1─1 TripAccommodation n─0..1 Accommodation (Katalog)
                     └─1─n AgendaItem n─0..1 Place (Katalog)
VisitorSession 1─n Favorite ─► genau eines von: Place | Accommodation
```

| Modell | Zweck |
| --- | --- |
| `City` | Mandantenfähigkeit vorbereitet (Zeitzone, Währung, Locale je Stadt). Im UI nur Baden. |
| `PlaceCategory` | Die 7 Kategorien im Bereich «Entdecken». |
| `PlaceTranslation`, `AccommodationTranslation` | Übersetzungen der Katalogtexte (zurzeit Englisch). |
| `Journey`, `JourneyStop` (+ Übersetzungen) | Thementouren mit geordneten Stationen; Reiseprofil eines Aufenthalts über `Trip.journeyId`. |
| `Place` | Kuratierter Ort. `kind` (Sehenswürdigkeit, Restaurant, Café, Museum …) ist feiner als die Kategorie und dient dem Favoritenfilter. Unverifizierte Angaben (Öffnungszeiten, Koordinaten, Preis) sind `null` bzw. `UNKNOWN`. |
| `Accommodation` | Unterkunft im Katalog (keine Buchung). |
| `VisitorSession` | Anonyme Gastidentität. Speichert nur `tokenHash`, `expiresAt`, `lastSeenAt` und ein für Magic-Link vorbereitetes `userId`. |
| `Trip` | Aufenthalt mit Kalenderdaten (`DATE`), `lastOpenedAt` (zuletzt aktiver Aufenthalt) und `clientRequestId` (Idempotenz). |
| `TripAccommodation` | Unterkunft eines Aufenthalts: Kopie der Katalogangaben (stabil, auch wenn der Katalog ändert) plus eigene Angaben. Optional verknüpft mit `Accommodation`. |
| `AgendaItem` | Konkrete Planung: Datum, Startminute, Dauer, Kategorie, Ort, Notiz. Optional mit einem `Place` verknüpft, sonst ein freier Termin. |
| `Favorite` | Gemerkter Ort **oder** gemerkte Unterkunft. Unabhängig von Aufenthalten, deshalb in mehreren Aufenthalten einplanbar. |

**Integrität:** UUIDs als Primärschlüssel, `createdAt`/`updatedAt` überall, Fremdschlüssel mit bewusstem Löschverhalten (Gast löschen → Cascade auf alles Persönliche; Katalogeintrag löschen → `SetNull` in Agenda und Unterkunft). Zusätzliche CHECK-Constraints in der Migration: Favorit hat genau ein Ziel, Abreise ≥ Anreise, Zeitbereiche gültig. Indizes auf allen Zugriffspfaden (`visitorSessionId`, `tripId + date + startMinutes`, Kategorie-Sortierung).

## Datum, Zeit und Zeitzone

- Kalendertage sind durchgehend ISO-Strings (`YYYY-MM-DD`) und in der DB `DATE` ohne Zeitzone. Sie werden immer als lokale Tage in **Europe/Zurich** interpretiert. Sommerzeitwechsel können damit keine Tage verschieben.
- Uhrzeiten sind Minuten seit Mitternacht (`startMinutes`, `durationMinutes`). Ein Termin endet spätestens um Mitternacht.
- «Heute» und «jetzt» werden explizit in Europe/Zurich berechnet (`todayInZurich`, `nowMinutesInZurich`), unabhängig von der Server-Zeitzone.
- **Konflikterkennung** (`src/lib/agenda.ts`): Einträge werden auf eine absolute Zeitachse gelegt (Tagesnummer × 1440 + Minuten) und per Sweep-Line in O(n log n) verglichen. Direkt anschliessende Termine gelten nicht als Konflikt. Konflikte **warnen**, blockieren aber nie.
- Ändern sich die Reisedaten, bleiben Agendaeinträge ausserhalb des neuen Zeitraums erhalten. Sie erscheinen gesondert und lassen sich verschieben. Beim Bearbeiten warnt die App vorab.

## Sicherheit

| Thema | Umsetzung |
| --- | --- |
| **Gast-Identität** | 256-Bit-Zufallstoken (`crypto.randomBytes`) im Cookie `__Host-baden_guest` (Produktion): HttpOnly, Secure, SameSite=Lax, Path=/. In der DB liegt nur der SHA-256-Hash. Sessions entstehen erst beim ersten Speichern. Rollierende Laufzeit von 180 Tagen. |
| **Autorisierung** | Jede Service-Funktion filtert nach `visitorSessionId`, auch Updates und Deletes (`findFirst/updateMany/deleteMany` mit Owner-Bedingung). Fremde und nicht existierende IDs sind nicht unterscheidbar (404). IDs aus dem Client werden nie als Berechtigung verstanden. |
| **Validierung** | Alle Eingaben serverseitig mit Zod (Längen, Formate, URL-Protokolle nur http/https, Datumslogik). Katalogverweise (`placeId`, `accommodationId`) werden gegen veröffentlichte Einträge derselben Stadt geprüft. |
| **CSRF** | Server Actions mit Origin-Prüfung durch Next.js, SameSite=Lax-Cookie, API-Routen nur lesend. |
| **XSS / Clickjacking** | React-Escaping, kein `dangerouslySetInnerHTML`, CSP ohne externe Quellen. Einbetten nur durch die eigene Origin. |
| **Injection** | Ausschliesslich parametrisierte Prisma-Abfragen. |
| **Fehlerbehandlung** | Nutzer sehen neutrale Meldungen. Details landen nur im Server-Log. |
| **Doppelte Speichervorgänge** | Client: Buttons während des Speicherns gesperrt. Server: `clientRequestId` (UUID, unique) bei Aufenthalt und Agendaeintrag. Parallele Doppel-Requests sind durch einen Integrationstest abgedeckt. |
| **Caching** | Persönliche API-Antworten: `private, no-store`, `Vary: Cookie`. Der Service Worker cacht keine Seiten und keine API-Antworten. |
| **Header** | CSP (`frame-ancestors 'self'`), `X-Frame-Options: SAMEORIGIN` (nur für die eigene Telefon-Vorschau), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `COOP`. `X-Powered-By` ist entfernt. |

**Bekannte Grenzen des MVP:** keine Ratenbegrenzung (Empfehlung: auf Plattform-/Proxy-Ebene), CSP mit `'unsafe-inline'` für Next.js-Bootstrapping (Nonce-basierte CSP ist ein Folgeschritt).

## Datenschutz (revDSG)

- **Datenminimierung:** keine Namen, E-Mails oder Standortdaten. Ohne Speichern entsteht weder Cookie noch DB-Eintrag.
- **Transparenz:** verständliche Datenschutzseite (`/datenschutz`).
- **Auskunft und Datenherausgabe:** JSON-Export unter Profil → «Meine Daten herunterladen» (`/api/me/export`).
- **Löschung:** «Alle meine Daten löschen» entfernt Session und alle abhängigen Daten (Cascade) und das Cookie. Automatische Löschung nach 180 Tagen Inaktivität (`pnpm db:purge`).
- **Keine Dritten:** keine Tracker, Fonts und Bilder werden selbst ausgeliefert. Externe Links (Karten, Websites) öffnen erst auf Klick.

## PWA

- Manifest (`src/app/manifest.ts`), Icons (192, 512, maskable, Apple Touch), Theme-Farben, Shortcuts.
- Service Worker (`public/sw.js`), nur in Produktion registriert:
  - statische, versionierte Assets (`/_next/static`, `/images`, `/icons`): cache-first
  - Navigationen: immer Netzwerk, **nie gespeichert**. Bei fehlender Verbindung kommt `/offline`.
  - API, Server Actions, RSC-Requests: werden nicht angefasst
- Persönliche Daten landen damit nie in einem Browser- oder Shared-Cache.

## Erweiterbarkeit

- **Magic-Link-Login:** `VisitorSession.userId` ist vorbereitet. Ablauf: User-Modell ergänzen → nach Login `userId` auf der aktuellen Session setzen → Services zusätzlich über `userId` autorisieren → weitere Sessions desselben Nutzers zusammenführen. Weil alle Services eine Owner-ID erhalten, bleibt die Änderung lokal.
- **Weitere Städte:** `City` mit Zeitzone und Locale. Katalog-Services filtern bereits nach Stadt (`DEFAULT_CITY_SLUG`).
- **Weitere Sprachen (z. B. Französisch):** Locale in `src/i18n/config.ts` ergänzen, Wörterbuch `fr.ts` anlegen (der Typ erzwingt Vollständigkeit), Übersetzungen in den Seed-Daten ergänzen – Routing, Formatierung und Fallback funktionieren ohne weitere Änderungen.
- **CMS:** Der Katalog kommt aus einer versionierten JSON-Quelle mit idempotentem Seed. Ein Headless-CMS kann diese Quelle später ersetzen.

## Tests

| Ebene | Werkzeug | Fokus |
| --- | --- | --- |
| Unit (56) | Vitest | Datum/Zeitzone/Sommerzeit, Reisezeitraum, Überschneidungen, nächster Termin, Validierung, Favoritenfilter, Suche |
| Integration (32) | Vitest + PostgreSQL | Services end-to-end inkl. Idempotenz unter Parallelität, Ownership (fremder Gast kann nichts lesen/ändern/löschen), Cascade-Löschung, DB-Constraints |
| E2E (58) | Playwright, Mobile + Desktop | Kompletter Nutzerablauf inkl. Reload und Fremdzugriff, Agenda-Konflikte, Validierung, Favoriten, PWA, Security-Header, Datenlöschung, axe-core WCAG 2.2 AA auf allen Hauptseiten |
