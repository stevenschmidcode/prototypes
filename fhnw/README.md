# Education Process Lab – Von Komplexität zu Klarheit

**Bessere Prozesse für Menschen, Bildung und Technologie.** Ein interaktives Prozesslabor zur Analyse, Harmonisierung und Digitalisierung von Administrationsprozessen in der Hochschulweiterbildung – am Beispiel einer fiktiven CAS-Anmeldung in drei Organisationsbereichen (Alpha, Beta, Gamma).

> Unabhängige Konzeptstudie als persönlicher Bewerbungsbeitrag für die Stelle *Process Owner\*in Betrieb Weiterbildung* an der Fachhochschule Nordwestschweiz FHNW. Kein offizielles Projekt der FHNW, keine Kenntnis interner Prozesse, Daten oder Systeme. Alle Prozesse, Rollen, Kennzahlen und Szenarien sind fiktiv; Alpha, Beta und Gamma stehen nicht für reale FHNW-Hochschulen. Keine offiziellen Logos.

- Live (geplant): https://officebaden.ch/prototypen/education-process-lab
- Datei: [`index.html`](index.html), eine einzige, eigenständige HTML-Datei ohne Build und ohne Abhängigkeiten (ausser Google Fonts)

---

## Inhalt

| Bereich | Hash | Inhalt |
| --- | --- | --- |
| **Start** | `#/` | Hero «Verschiedene Hochschulen. Eine gemeinsame Richtung.» mit Visualisierung: drei IST-Pfade verschmelzen zum Kernprozess, eine fachliche Variante bleibt sichtbar |
| **01 Erkunden** | `#/explorer` | Swimlane-Prozessmodelle (BPMN-inspiriert) für Alpha, Beta, Gamma; Analyse-Linsen (Medienbrüche, Doppelarbeit, Wartezeiten, unklare Verantwortung, Standards, Hürden für Interessierte); Detailansicht mit simulierten Beobachtungen; Listenansicht; Vergleichsmatrix nach Phasen |
| **02 Menschen** | `#/people` | 5 Stakeholder, Einfluss/Interesse-Matrix, 9 Anforderungen mit WSJF-Priorisierung (Schieberegler), Akzeptanzkriterien, Verknüpfung zu Prozessschritten, 3 Zielkonflikte mit begründeter Empfehlung |
| **03 Harmonisieren** | `#/harmonise` | IST/SOLL-Umschaltung mit animierter Zusammenführung, gemeinsamer Kernprozess (6 Phasen), Entscheidungspunkte mit Abwägungen und offengelegten Annahmen, 4 fachliche Varianten. Darunter die **Wirkung**: 9 Kennzahlen IST vs. SOLL, berechnet aus Prozessdaten und gewählten Optionen; Durchlaufzeit nach Phase; Kosten der Varianten; Begriffe, Modellannahmen, Datentabelle |
| **04 Umsetzung** | `#/umsetzung` | **Roadmap** Verstehen → Abstimmen → Gestalten → Pilot → Skalieren mit Zielen, Ergebnissen, Abhängigkeiten, Erfolgskriterien und Zuordnung strategischer Ziele (hypothetisch, ohne Termine); **Change**: sechs Handlungsfelder, Change in fünf Schritten, Szenario «Eine Hochschule möchte ihren Prozess beibehalten» mit kontextabhängiger Bewertung von drei Vorgehensweisen; **Governance**: RACI-Matrix, Änderungsantrag Schritt für Schritt, bearbeitbares Entscheidungsprotokoll (DEC-001 bis DEC-003 + Workshop-Entscheide) |
| **05 Workshop** | `#/workshop` | Moderierter Ablauf in 6 Schritten: Prozess → Schwachstelle → Stakeholder → Massnahme → Auswirkung → Entscheid; druckbare Zusammenfassung |
| Über das Projekt | `#/about` | Nicht in der Navigation, erreichbar über die Startseite («Über das Projekt»): Ansatz, Person, Umsetzungsentscheide, Modellannahmen und Grenzen |

Die früheren Adressen `#/impact`, `#/roadmap`, `#/change` und `#/governance` funktionieren weiter: sie öffnen die zusammengelegte Seite und springen zum passenden Abschnitt (Wirkung, Roadmap, Change, Governance).

Deep Link auf einen Prozessschritt: `#/explorer?step=A-05`, auf eine Anforderung: `#/people?req=REQ-003`.

## Modell

- Kennzahlen werden aus strukturierten Prozessschritten berechnet, nie hartcodiert.
- Sequenzielle Ausführung: Durchlaufzeit = Σ Wartezeit + Σ Bearbeitungszeit (1 Arbeitstag = 8 h).
- Optionale Schritte (z. B. Nachforderung) werden mit ihrer Eintrittswahrscheinlichkeit gewichtet.
- Übergaben = Rollenwechsel zwischen Aktivitäten von Personen; Systemschritte zählen nicht.
- Alle Parameter sind plausible Annahmen eines fiktiven Szenarios und in der Oberfläche offengelegt.

## Aufbau der Datei

- `<script id="epl-core">` – Fixtures, Fachlogik (Kennzahlen, Varianten, WSJF, Workshop-Zustand) und Store mit LocalStorage-Persistenz; ohne DOM-Zugriff
- `<script id="epl-ui">` – Hash-Router, Rendering und Interaktion
- Zustand unter `epl.state.v1` im LocalStorage; «Demo zurücksetzen» im Footer stellt die Standarddaten wieder her

## Tests

```sh
node --test tests/core.test.mjs   # 21 Unit-Tests gegen den epl-core-Block aus index.html
```

[`tests/e2e.html`](tests/e2e.html) steuert die echte Seite in einem iframe (Explorer, IST/SOLL, Varianten, WSJF, kompletter Workshop bis ins Entscheidungsprotokoll, Reload, Reset). Headless ausführen, z. B. mit Edge/Chrome:

```sh
msedge --headless=new --allow-file-access-from-files --virtual-time-budget=30000 --dump-dom file:///…/fhnw/tests/e2e.html
```

Das Ergebnis steht im `<title>` (z. B. `E2E 22/22 passed`).

## Barrierefreiheit

Tastaturbedienung, sichtbare Fokuszustände, Screenreader-Beschriftungen und Live-Regionen, Listen- und Tabellenalternativen zu Diagrammen, `prefers-reduced-motion`, responsive bis 390 px.

---

Steven Schmid · [stevenschmid.ch](https://stevenschmid.ch) · [officebaden.ch](https://officebaden.ch)
