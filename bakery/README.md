# Bakery Club – Loyalty- & Customer-Experience-Konzept für Bakery Bakery

**A little joy in every bite. Good things are baking.** Ein spielerisches digitales Kundenbindungsprogramm für die vegane Schweizer Bäckerei Bakery Bakery: digitaler Pass, transparenter Treat Tracker, kleine freiwillige Challenges und ein eigener Bakery Buddy, der mit jedem Besuch ein Kapitel weiterwächst.

> Unabhängige Konzeptstudie als Initiativbewerbung von Steven Schmid (Digital Products · Customer Experience · Innovation). Not affiliated with or commissioned by Bakery Bakery. Rewards and customer data are fictional.

- Live (geplant): https://officebaden.ch/prototypen/bakery-club
- Datei: [`index.html`](index.html) ist eine einzige, eigenständige HTML-Datei. JS, CSS, Schriften und SVGs sind eingebettet. Sie braucht keinen Server und keine externen Abhängigkeiten und funktioniert auch per Doppelklick.

---

## Inhalt

**Mobile:** Die App läuft im Vollbild. Über ⓘ öffnet sich «Behind the Dough», über das Kolben-Symbol die Demo-Controls.
**Desktop (ab 1024 px):** Links steht das Editorial-Konzept, rechts das bedienbare Smartphone, darunter die Product-Thinking-Perspektive.

| Bereich | Inhalt |
| --- | --- |
| **Onboarding** | HEY YOU!, Buddy-Wahl (Croissant Kid, Coffee Bean, Bread Buddy), Namensgebung mit Vorschlägen, Welcome |
| **Home** | Buddy mit Reaktionen auf den Fortschritt, Bakery Journey als «Dough Trail», Quick Actions |
| **Pass / Scan & Collect** | Mitgliedskarte mit fiktiver Nummer und Demo-QR, «Simulate a purchase» (klar als Demo markiert) |
| **Treats** | Pro CHF 150 gibt es einen Kaffee (frei erfundene Konzeptannahme), Überschuss bleibt erhalten, verfügbare und eingelöste Rewards mit Datum, Demo-Einlösung ohne Codes |
| **Bakery Moments** | 5 freiwillige Challenges (First Bite, Coffee Explorer, Something New, Bakery Tourist, Early Bird), ohne Streaks und ohne Kaufdruck |
| **Bakery Map** | 11 Filialen mit den Adressen von bakerybakery.ch/standorte (Stand Okt. 2026), Link zur Navigation, bewusst ohne Öffnungszeiten |
| **My Bakery Story** | Tagebuch-Timeline, die nur aus tatsächlichen Demo-Aktionen entsteht |
| **Buddy** | 4 Kapitel (Fresh Dough → Getting Toasty → Croissant Companion → Bakery Legend), 5 Accessoires |

**Zwei Spuren, bewusst getrennt:** Geld führt zu Treats, Momente führen zur Buddy-Entwicklung. Der Buddy wächst also auch ganz ohne Ausgaben. Der QR-Code allein schreibt nie etwas gut. In einem echten Produkt bestätigt nur ein vertrauenswürdiges Kassensystem eine Gutschrift.

## Entwicklung

`index.html` ist das Build-Ergebnis. Der Quellcode liegt in `src/` (React, TypeScript, Vite, Tailwind CSS, Lucide).

```bash
npm install
npm run dev     # Dev-Server
npm test        # Unit-Tests der Loyalty-Engine (Vitest)
npm run build   # Typecheck + Build → schreibt index.html neu
```

| Pfad | Zweck |
| --- | --- |
| `src/state/engine.ts` | Reine Loyalty-Logik: Beträge in Rappen, CHF-150-Regel, Übertrag, Schutz vor Doppelgutschrift, Challenges, Kapitel. Getestet in `engine.test.ts` |
| `src/state/store.tsx` | React-Context, LocalStorage (`bakery-club:v1`), Celebration-Queue |
| `src/buddy/Buddy.tsx` | Die drei SVG-Buddies auf einem gemeinsamen Skelett (Posen, Mimik, Accessoires, Kapitel) |
| `src/screens/` | Onboarding, Home, Pass, Treats, Moments, Map, Story, Buddy |
| `src/desktop/` | Landingpage und «Behind the Dough» |
| `src/data/` | Demo-Katalog (erfundene Preise), Challenges, Filialen |
| `src/index.html` | HTML-Vorlage für den Build (nicht direkt öffnen) |

Der Demo-Fortschritt liegt nur im LocalStorage des Browsers. Über Demo-Controls → «Reset demo» wird er zurückgesetzt.
