# KSB Begleiter – Patienten-App & Business-Analyse-Fallstudie

**Vom Patienten-Prototyp zur interaktiven Fallstudie.** Eine digitale Begleitung für den stationären Aufenthalt am Kantonsspital Baden (KSB) und dazu der Weg dorthin: Prozessanalyse, Anforderungen, Stakeholder, Architektur und Wirkung.

> Unabhängige Konzeptstudie als persönlicher Bewerbungsbeitrag für die Stelle *ICT Business Analyst_in 80–100 %* am KSB. Kein Auftrag des KSB, kein Zugriff auf interne Systeme, Prozesse oder Daten. Alle Prozesse, Systemlandschaften und Kennzahlen sind illustrativ.

- Live: https://officebaden.ch/prototypen/ksb-begleiter
- Datei: [`index.html`](index.html), eine einzige, eigenständige HTML-Datei ohne Build und ohne Abhängigkeiten (ausser Google Fonts)

---

## Inhalt

Die Anwendung verbindet zwei Perspektiven, umschaltbar über die Navigation oben.

| Bereich | Hash | Inhalt |
| --- | --- | --- |
| **Erlebnis** | `#erlebnis` | Patienten-App im Smartphone-Rahmen: Patient Journey (vor Eintritt, Aufenthalt, Austritt), Tagesablauf, Menüwahl mit Allergie- und Nüchtern-Sperre, Bestellung aufs Zimmer, Coiffeur-Buchung, Anliegen an die Pflege, Checkliste, Services. Schalter «Schnittstellen einblenden» zeigt HL7-/FHIR-Bezüge in der App. |
| **02 Prozess** | `#prozess` | IST/SOLL der Menübestellung als Swimlanes (Patient_in, Pflege/Hotellerie, Küche, IT), Medienbrüche, klickbare Schritte mit Schwachstellen, Annahmen und offenen Fragen, Analysebox |
| **03 Anforderungen** | `#anforderungen` | 12 Anforderungen (REQ-001 bis REQ-012), Filter nach Stakeholder und MoSCoW, Umschaltung User Story / fachliche Anforderung, Akzeptanzkriterien, Abhängigkeiten, Herkunft im Prozess, Release-Schnitt |
| **04 Stakeholder** | `#stakeholder` | Matrix Einfluss × Betroffenheit mit 8 Gruppen; Bedürfnisse, Bedenken, Business-Analyse-Frage; verknüpft mit Anforderungen und Prozessschritten |
| **05 Architektur** | `#architektur` | Zielbild mit Datenflüssen (Menübestellung, Menü filtern, Austritt/Nüchternheit, Röntgen), HL7 v2 / FHIR / DICOM «wo sinnvoll, wo nicht», Sicherheitsgrundsätze, Datenminimierungs-Matrix |
| **06 Wirkung** | `#wirkung` | Messplan (KPIs ohne erfundene Zahlen), Szenario-Rechner mit sichtbarem Rechenweg, Risikomatrix, offene Fragen vor der Umsetzung |

Auf jeder Analyse-Seite: Methodik-Leiste *Verstehen → Analysieren → Konzipieren → Validieren → Umsetzen → Messen*, Blättern und «Über diese Konzeptstudie».

### Deep Links

Einzelne Elemente lassen sich direkt verlinken, auch innerhalb eines iframes:

| Beispiel | Öffnet |
| --- | --- |
| `#prozess/i3` | IST-Schritt «Karten einsammeln & erfassen» (`i1`–`i8` IST, `s1`–`s8` SOLL) |
| `#anforderungen/REQ-002` | Anforderung im Detail |
| `#anforderungen/release` | Release-Schnitt |
| `#stakeholder/pflege` | Stakeholder (`patient`, `pflege`, `aerzte`, `ernaehrung`, `kueche`, `ict`, `dsis`, `mgmt`) |
| `#architektur/kis` | Systemkomponente (`begleiter`, `station`, `iam`, `bff`, `hub`, `ris`, `kis`, `termin`, `kueche`, `buchung`) |

## Aufbau der Datei

`index.html` ist bewusst eine einzige Datei, damit sie überall ohne Build eingebunden werden kann.

| Abschnitt | Zweck |
| --- | --- |
| `<style>` | Design-Tokens (`:root`, Dark/Light), Patienten-App, danach «Case study shell» und «Business analysis workspace» |
| 1. `<script>` **DATA** | Alle Inhalte: Patientendaten, Services (von kantonsspitalbaden.ch) und `CASE` mit Prozess, Anforderungen, Stakeholdern, Architektur, KPIs, Rechner-Defaults, Risiken, offenen Fragen, Methodik, «Über»-Text |
| 2. `<script>` **Perspective A** | Patienten-App; stellt `window.KSBApp.show(phase, tab, day)` für Sprünge aus der Fallstudie bereit |
| 3. `<script>` **Perspective B** | Fallstudie: Hash-Router, Rendering der fünf Module, Verbindungslinien (SVG), Szenario-Rechner |

Inhalte ändern = Daten im `CASE`-Objekt ändern; die Darstellung passt sich an. Querverweise (REQ ↔ Prozessschritt ↔ Stakeholder) werden aus den Daten berechnet.

Darstellung: Dark Mode als Standard, Umschalter oben rechts (wird im `localStorage` gemerkt). Responsive ab 360 px; auf dem Handy werden Detailansichten zu Bottom Sheets. `prefers-reduced-motion` wird respektiert.

## Lokal ansehen

`index.html` im Browser öffnen. Kein Server nötig.

## Einbindung auf officebaden.ch

Aktueller Stand der Live-Seite (Next.js):

- Seite: `https://officebaden.ch/prototypen/ksb-begleiter`
- Die Seite bettet die App per iframe ein:
  `<iframe src="/prototypen/ksb-begleiter/app.html" title="KSB Begleiter" allow="fullscreen">`
- `app.html` ist eine **unveränderte Kopie** von `ksb/index.html` (statische Datei, vermutlich unter `public/prototypen/ksb-begleiter/app.html`, im officebaden-Projekt prüfen).

### Aktualisieren

1. `ksb/index.html` aus diesem Repository unverändert als `app.html` an den oben genannten Ort kopieren.
2. Seitentexte der Prototyp-Seite anpassen (siehe Vorschlag unten), da die App jetzt zwei Perspektiven hat.
3. iframe-Höhe prüfen: Die Analyse-Seiten sind lang und scrollen **innerhalb** des iframes. Empfohlen: iframe mindestens so hoch wie der sichtbare Bereich unter dem officebaden-Header (z. B. `height: calc(100dvh - <Headerhöhe>)`), damit nicht zwei Scrollbereiche ineinander liegen. Auf Desktop braucht die Erlebnis-Ansicht etwa 900 px Höhe.
4. Optional: Direkt-Links von der officebaden-Seite in einzelne Module, z. B. Buttons mit `src` bzw. Link auf `app.html#prozess` oder `app.html#architektur`.
5. Kontrolle: Seite auf Desktop und Handy öffnen, Navigation durchklicken, «Im Prototyp ansehen» in `#anforderungen/REQ-001` testen (springt zurück in die App).

Die App lädt nur Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`). Falls officebaden.ch eine Content-Security-Policy für den iframe-Inhalt setzt, müssen diese beiden Hosts für Styles bzw. Fonts erlaubt sein.

### Vorschlag für Seitentexte

**Titel:** KSB Begleiter · Patienten-App & Business-Analyse-Fallstudie

**Meta-Description:**
> Digitale Patientenbegleitung für den Spitalaufenthalt und der Weg dorthin: Prozessanalyse IST → SOLL, Requirements, Stakeholder, Architektur mit HL7, FHIR und DICOM sowie ein Szenario-Rechner. Unabhängige Konzeptstudie.

**Teaser:**
> Wie könnte eine moderne digitale Patientenbegleitung aussehen, und wie entsteht sie? Der KSB Begleiter verbindet einen klickbaren Patienten-Prototyp mit einer Business-Analyse-Fallstudie am Beispiel der Menübestellung: von Medienbrüchen im IST-Prozess über priorisierte Anforderungen und Stakeholder bis zu Schnittstellen, Datenschutz und messbarem Nutzen.

**Hinweis (Pflicht):**
> Unabhängige Konzeptstudie als persönlicher Bewerbungsbeitrag. Kein Auftrag des Kantonsspitals Baden; alle Prozesse, Systeme und Kennzahlen sind illustrativ.

### Anweisung für Claude Code im officebaden-Projekt

Diesen Block im officebaden-Repository als Auftrag verwenden:

```text
Aktualisiere den Prototyp «KSB Begleiter» auf officebaden.ch.

Quelle: https://github.com/stevenschmidcode/prototypes/blob/main/ksb/index.html
(Beschreibung und Vorgaben: ksb/README.md im selben Repository)

1. Finde, wo /prototypen/ksb-begleiter/app.html ausgeliefert wird (vermutlich public/prototypen/ksb-begleiter/app.html)
   und ersetze die Datei durch ksb/index.html – unverändert, nicht umformatieren.
2. Passe Titel, Meta-Description und Teaser der Seite /prototypen/ksb-begleiter gemäss Abschnitt
   «Vorschlag für Seitentexte» im README an. Der Hinweis «Unabhängige Konzeptstudie …» muss sichtbar bleiben.
3. Prüfe die iframe-Höhe: kein doppeltes Scrollen; Desktop mind. ca. 900 px, mobil möglichst volle Höhe
   unter dem Seiten-Header.
4. Optional: Direkt-Links in die Module ergänzen (app.html#prozess, #anforderungen, #stakeholder,
   #architektur, #wirkung), passend zum bestehenden Design der Seite.
5. Falls eine Content-Security-Policy greift: fonts.googleapis.com und fonts.gstatic.com erlauben.
6. Lokal bauen und auf Desktop und Mobil prüfen; danach committen. Nicht deployen, bevor ich es freigebe.
```

## Qualitätssicherung

Vor jeder Veröffentlichung geprüft (headless Edge): alle Ansichten und Bedienelemente ohne JavaScript-Fehler, Deep Links, Rechenweg des Szenario-Rechners (100 × 60 % × 2 min = 120 min/Tag ≈ 730 h/Jahr), Rückverfolgbarkeit Anforderung ↔ Prozessschritt in beide Richtungen, Desktop (1440 px) und Mobil (360–390 px), Dark und Light Mode.

## Quellen und Annahmen

- Services, Öffnungszeiten, Besuchszeiten und Eintritts-Checkliste: kantonsspitalbaden.ch (Stand Oktober 2026)
- Patientin, Termine, Menüs, Preise: fiktiv
- IST-Prozess, Systemlandschaft, Stakeholder-Einschätzungen, Risiken: illustrative Annahmen, als solche gekennzeichnet
- Szenario-Rechner: frei veränderbare Annahmen, keine erhobenen KSB-Betriebsdaten

---

Steven Schmid · Softwareentwicklung · Product Ownership · Business Analyse · Digitale Produktkonzeption · [stevenschmid.ch](https://stevenschmid.ch) · [officebaden.ch](https://officebaden.ch)
