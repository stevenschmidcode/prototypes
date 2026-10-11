# Produkt: baden. – MVP 0.1 «Mein Aufenthalt»

## Vision

Ein digitaler Stadtbegleiter, der sich wie eine hochwertige Travel-App anfühlt, nicht wie eine Gemeindewebsite. Im ersten Release liegt der Fokus ganz auf **Besucherinnen und Besuchern**: Sie sollen Baden entdecken und ihren Aufenthalt in wenigen Schritten planen können.

**Leitsatz:** «Das ist nicht einfach eine Website. Das ist ein durchdachtes digitales Produkt.»

## Zielgruppen der Demonstration

1. Stadt Baden / Digitale Transformation
2. Stadtmarketing und Tourismus
3. Lokale Hotels
4. Regionale Unternehmen
5. Potenzielle Arbeitgeber und Projektpartner

## Reiseführer in zwei Sprachen

Die App ist vollständig auf Deutsch (Schweiz) und Englisch verfügbar – Oberfläche, Ortsbeschreibungen, Thementouren, Validierungsmeldungen und Datumsformate. Der Sprachumschalter (Kopfzeile, Fusszeile, Profil, Desktop-Tour) bleibt auf derselben Seite. Englische Inhalte nutzen britische Schreibweise; Eigennamen, Strassen und Ausstellungstitel bleiben deutsch.

## Reiseprofile (Thementouren)

«Wie möchtest du Baden erleben?» – sechs kuratierte Touren mit Stationen in sinnvoller Reihenfolge und einem kurzen Erzähltext pro Station:

| Tour | Persona | Stationen |
| --- | --- | --- |
| Mittelalter & Geschichte | Für Geschichtsfans | Ruine Stein, Stadtturm, Stadtkirche, Tagsatzungssaal, Altstadt, Holzbrücke, Landvogteischloss, Bäderquartier |
| Wellness & Thermalwasser | Für Erholungssuchende | Kurpark, Bäderquartier, Heisse Brunnen, Limmatpromenade, FORTYSEVEN |
| Coffee Lover | Für Kaffeeliebhaber:innen | caffè UNO (Gleis 1), Confiserie Himmel, GapsCup, YanaCocha, Frau Meise, Kafi Raab |
| Kunst & Kultur | Für Kunstinteressierte | Kunstraum, Museum Langmatt, Villa-Boveri-Park, Kurtheater, ThiK, Landvogteischloss |
| Natur & Aussicht | Für Draussen-Menschen | Limmatpromenade, Ruine Stein, Teufelskeller, Baldegg, Waldgasthaus |
| Familie & Entdeckerkinder | Für Familien | Kindermuseum, Alter Stadtfriedhof (Spielplatz), Heisse Brunnen, Baldegg |

Ein Reiseprofil kann beim Erstellen eines Aufenthalts gewählt werden. Das Dashboard empfiehlt dann die passende Tour. Jede Tour lässt sich **als Tagesprogramm übernehmen**: Tag und Startzeit wählen, Puffer für Wege festlegen und die Zeiten in der Vorschau prüfen – danach liegen alle Stationen in der Agenda und bleiben einzeln bearbeitbar.

## Flexibel planen

- **Touren anpassen:** Vor dem Übernehmen lassen sich Stationen abwählen, in der Reihenfolge verschieben und in der Zeit vor Ort ändern. Die Uhrzeiten aktualisieren sich live, und «Zurücksetzen» stellt die kuratierte Tour wieder her.
- **Freie Zeit:** Die Agenda erkennt freie Zeitfenster und schlägt passende Orte vor, jeweils mit Begründung, zum Beispiel:
  - Reiseprofil
  - Mittag- oder Abendessen
  - Kaffeepause
  - Regenwetter
- Ein Tipp plant den Vorschlag ein, «Rückgängig» nimmt ihn wieder heraus.

## Produktlogik

| Konzept | Bedeutung |
| --- | --- |
| **Aufenthalt** | Ein Besuch mit festen Reisedaten. Ein Gast kann mehrere Aufenthalte haben. Jeder hat eine eigene Agenda und optional eine Unterkunft. |
| **Unterkunft** | Aus dem Katalog gewählt, frei erfasst (Ferienwohnung, private Adresse) oder bewusst weggelassen. Bietet Navigation, Anruf, Website und Check-in/-out-Infos. |
| **Agendaeintrag** | Eine konkrete Planung zu einem Zeitpunkt. Entweder aus dem Katalog übernommen oder ein eigener Termin. |
| **Favorit** | Ein gemerkter Ort oder eine gemerkte Unterkunft, unabhängig von einem Aufenthalt. Ein Favorit kann in beliebig vielen Aufenthalten eingeplant werden. |

Favoriten und Agenda sind bewusst getrennt: **merken** heisst «interessiert mich», **planen** heisst «mache ich dann».

## Informationsarchitektur

| Bereich | Inhalte |
| --- | --- |
| **Start** | Hero, Suche, Schnellzugriff auf den aktiven Aufenthalt (oder Einladung zur Planung), Reiseprofile, Kategorien, Empfehlungen, Veranstaltungen, persönliche Favoriten, Einstieg in die Reiseplanung |
| **Entdecken** | Katalog mit Kategorien und umlaut-toleranter Suche, Detailseiten («Teil dieser Touren»), Unterkünfte |
| **Touren** | Sechs Thementouren mit Zeitstrahl, Route zu Fuss und «Als Tagesprogramm übernehmen» |
| **Mein Aufenthalt** | Onboarding oder zuletzt aktiver Aufenthalt: Dashboard, Agenda (Tagesansicht und Liste), Unterkunft, Bearbeiten |
| **Profil** | Gastprofil, aktuelle und frühere Aufenthalte, Favoriten, Sprache, Datenschutz, Datenexport, Datenlöschung |

Mobile: Bottom Navigation mit fünf Bereichen (Start, Entdecken, Touren, Aufenthalt, Profil).

**Desktop-Startseite = geführte Website-Tour** (Aufbau wie *Let's Have a Coffee*): ein Bildschirm ohne Scrollen, links 7 Kapitel (Start, Entdecken, So geht's, Agenda, Favoriten, Installieren, Datenschutz), rechts die bedienbare App im Telefon. Die Kapitel wechseln von selbst; Tabs mit Countdown-Ring unten links; Bilder und Schritte im Text öffnen die passende Seite im Telefon; «Demo ausprobieren» holt das Telefon in die Mitte. Unterseiten auf dem Desktop zeigen die volle Web-Ansicht mit Kopfzeile.

## Kernabläufe

1. **Aufenthalt erstellen** (2 Schritte): Name und Reisedaten (Vorschlag: nächstes Wochenende), danach die Unterkunft. Diese lässt sich auch überspringen.
2. **Entdecken → Merken → Einplanen**: Auf jeder Detailseite «Zum Aufenthalt hinzufügen». Tag und Uhrzeit wählen, die Startzeit wird nach dem letzten Termin des Tages vorgeschlagen. Überschneidungen werden live angezeigt.
3. **Agenda pflegen**: eigene Termine, Bearbeiten, auf einen anderen Tag verschieben, Uhrzeit ändern, Löschen (mit Bestätigung). Konflikte sind markiert, leere Tage laden zum Entdecken ein.
4. **Dashboard**: nächste Aktivität (oder «gerade jetzt»), Unterkunft, Tagesprogramm, Schnellaktionen, gemerkte und noch nicht geplante Favoriten.

## Inhalte

- **39 Orte** in 7 Kategorien und **8 Unterkünfte**, recherchiert am 8. und 11. Oktober 2026 auf offiziellen Websites, deinbaden.ch, baden.ch und Wikipedia. Quellen pro Eintrag in `prisma/seed-data/catalog.json`.
- **Nichts erfunden:** Öffnungszeiten, Preise, Koordinaten und Check-in-Zeiten sind nur gesetzt, wenn sie verifiziert sind. Sonst zeigt die App «Nicht verifiziert – bitte auf der offiziellen Website prüfen».
- **Aktuelle Hinweise im Katalog:** Das Grand Casino spielt während des Umbaus 2026 im Pop-up-Casino. Die Badenfahrt ist für den 20.–29. August 2027 angekündigt, Fantoche für den 7.–12. September 2027, das Badener WunderDorf läuft vom 29. Oktober bis 23. Dezember 2026.
- **Fotos:** 24 frei lizenzierte Bilder (Wikimedia Commons, CC BY/CC BY-SA) mit Nachweis auf Detailseite und unter `/bildnachweise`. Orte ohne geeignetes Foto zeigen eine eigens gestaltete Illustration im Bauhaus-Stil.
- Aufenthaltsdauern pro Ort sind redaktionelle Schätzungen.

## Designsystem

| Token | Wert | Einsatz |
| --- | --- | --- |
| Paper | `#F8F7F3` | Hintergrund |
| Forest | `#303E34` | Primär, aktive Zustände |
| Sand | `#E8E1D5` | Sekundärflächen |
| Terracotta | `#B96D52` / `#8C4A33` | Akzent / Akzent für kleine Schrift (AA-Kontrast) |
| Ink | `#222521` | Text |

- Typografie: Geist (Headlines mit enger Laufweite), Geist Mono für kleine redaktionelle Labels.
- Grosszügige Radien, ruhige Flächen, dezente Einblend-Animationen (abgeschaltet bei `prefers-reduced-motion`).
- Touch-Ziele ≥ 44 px, Dialoge als Bottom Sheets auf Mobile, Safe-Area-Unterstützung.
- Alle Tokens zentral in `src/app/globals.css`.

## Qualitätsmerkmale

- WCAG 2.2 AA als Ziel, automatisiert mit axe-core auf allen Hauptseiten geprüft. Dazu Skip-Link, sichtbare Fokuszustände, semantische Struktur und Live-Regionen für Warnungen.
- Loading-, Empty- und Error-States auf jeder Seite.
- Funktioniert ohne Registrierung. Daten bleiben nach dem Reload erhalten.
- Installierbar als PWA mit Offline-Fallback.

## Bewusste Annahmen

- Reisezeitraum maximal 60 Tage. Ein Termin endet spätestens um Mitternacht.
- Check-in/-out sind optionale Angaben. Die Standardwerte kommen aus dem Katalog, falls dort verifiziert.
- Die Navigation öffnet Google-Maps-URLs. Diese öffnen auf iOS und Android die installierte Karten-App.
- Sprachen: Deutsch (Schweiz) und Englisch. Französisch ist architektonisch vorbereitet.
