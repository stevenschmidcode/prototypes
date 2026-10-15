# Education Process Lab – From Complexity to Clarity

**Designing better processes for people, education and technology.** Ein interaktives Prozesslabor zur Analyse, Harmonisierung und Digitalisierung von Administrationsprozessen in der Hochschulweiterbildung – am Beispiel einer fiktiven CAS-Anmeldung in drei Organisationsbereichen (Alpha, Beta, Gamma).

> Unabhängige Konzeptstudie als persönlicher Bewerbungsbeitrag für die Stelle *Process Owner\*in Betrieb Weiterbildung* an der Fachhochschule Nordwestschweiz FHNW. Kein offizielles Projekt der FHNW, keine Kenntnis interner Prozesse, Daten oder Systeme. Alle Prozesse, Rollen, Kennzahlen und Szenarien sind fiktiv; Alpha, Beta und Gamma stehen nicht für reale FHNW-Hochschulen. Keine offiziellen Logos.

- Live (geplant): https://officebaden.ch/prototypen/education-process-lab
- Datei: [`index.html`](index.html), eine einzige, eigenständige HTML-Datei ohne Build und ohne Abhängigkeiten (ausser Google Fonts)

---

## Inhalt

| Bereich | Hash | Inhalt |
| --- | --- | --- |
| **Start** | `#/` | Hero «Different schools. One shared direction.» mit Visualisierung: drei IST-Pfade verschmelzen zum Kernprozess, eine fachliche Variante bleibt sichtbar |
| **01 Explore** | `#/explorer` | Swimlane-Prozessmodelle (BPMN-inspiriert) für Alpha, Beta, Gamma; Analyse-Linsen (Medienbrüche, Doppelarbeit, Wartezeiten, unklare Verantwortung, Standards, Nutzererlebnis); Detail-Drawer mit simulierten Beobachtungen; Listenansicht; Vergleichsmatrix nach Phasen |
| **02 People** | `#/people` | 5 Stakeholder, Einfluss/Interesse-Matrix, 9 Requirements mit WSJF-Priorisierung (Schieberegler), Akzeptanzkriterien, Verknüpfung zu Prozessschritten, 3 Zielkonflikte mit begründeter Empfehlung |
| **03 Harmonise** | `#/harmonise` | IST/SOLL-Umschaltung mit animierter Zusammenführung, gemeinsamer Kernprozess (6 Phasen), Entscheidungspunkte mit Trade-offs und offengelegten Annahmen, 4 fachliche Varianten |
| **04 Impact** | `#/impact` | 9 Kennzahlen IST vs. SOLL, berechnet aus Prozessdaten und gewählten Optionen; Durchlaufzeit nach Phase; Kosten der Varianten; Definitionen und Modellannahmen; Datentabelle |
| **05 Roadmap** | `#/roadmap` | Understand → Align → Design → Pilot → Scale mit Zielen, Deliverables, Abhängigkeiten, Erfolgskriterien; Zuordnung strategischer Ziele (hypothetisch, ohne Termine) |
| **06 Change** | `#/change` | Sechs Handlungsfelder, Change Journey, Szenario «Eine Hochschule möchte ihren Prozess beibehalten» mit kontextabhängiger Bewertung von drei Vorgehensweisen |
| **07 Governance** | `#/governance` | RACI-Matrix, Change Request Schritt für Schritt, bearbeitbares Decision Log (DEC-001 bis DEC-003 + Workshop-Entscheide) |
| **08 Workshop** | `#/workshop` | Moderierter Ablauf in 6 Schritten: Prozess → Schwachstelle → Stakeholder → Massnahme → Auswirkung → Entscheid; druckbare Zusammenfassung |
| **09 About** | `#/about` | Ansatz, Creator, Implementierungsentscheide, Modellannahmen und Grenzen |

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
- Zustand unter `epl.state.v1` im LocalStorage; «Reset demo» im Footer stellt die Standarddaten wieder her

## Tests

```sh
node --test tests/core.test.mjs   # 21 Unit-Tests gegen den epl-core-Block aus index.html
```

[`tests/e2e.html`](tests/e2e.html) steuert die echte Seite in einem iframe (Explorer, IST/SOLL, Varianten, WSJF, kompletter Workshop bis ins Decision Log, Reload, Reset). Headless ausführen, z. B. mit Edge/Chrome:

```sh
msedge --headless=new --allow-file-access-from-files --virtual-time-budget=30000 --dump-dom file:///…/fhnw/tests/e2e.html
```

Das Ergebnis steht im `<title>` (z. B. `E2E 22/22 passed`).

## Barrierefreiheit

Tastaturbedienung, sichtbare Fokuszustände, Screenreader-Beschriftungen und Live-Regionen, Listen- und Tabellenalternativen zu Diagrammen, `prefers-reduced-motion`, responsive bis 390 px.

---

Steven Schmid · [stevenschmid.ch](https://stevenschmid.ch) · [officebaden.ch](https://officebaden.ch)
