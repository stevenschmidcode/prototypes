# Roadmap

## ✅ MVP 0.1 – Mein Aufenthalt (abgeschlossen)

- [x] **Inkrement 1 – Foundation:** Next.js 16, Designsystem, Layout, Navigation, PostgreSQL + Prisma, Gast-Sessions, Grundtests
- [x] **Inkrement 2 – Discover Baden:** verifizierter Katalog (26 Orte, 8 Unterkünfte), Kategorien, Suche, Detailseiten, Favoriten
- [x] **Inkrement 3 – Mein Aufenthalt:** Aufenthalte, Unterkunft (Katalog/manuell/keine), Dashboard, Agenda, eigene Termine, Konflikterkennung
- [x] **Inkrement 4 – Polish:** responsive Optimierung, Animationen, Empty States, PWA, Accessibility (axe-core), E2E-Tests, Dokumentation

## ✅ 0.2 – Reiseführer (abgeschlossen)

- [x] Englisch für Oberfläche und Inhalte (`/en`), Sprachumschalter, hreflang
- [x] Reiseprofile: sechs kuratierte Thementouren mit Erzähltexten, Route zu Fuss und «Als Tagesprogramm übernehmen»
- [x] Katalog erweitert auf 39 verifizierte Orte (Stadtkirche, Tagsatzungssaal, Stadtführungen, Cafés, Kunstraum, ThiK, Villa-Boveri-Park …)

## ✅ 0.2.1 – Flexibel planen (abgeschlossen)

- [x] Touren vor dem Übernehmen anpassen (Stationen, Reihenfolge, Dauer)
- [x] «Freie Zeit»: regelbasierte Vorschläge für Lücken im Tagesprogramm, mit Begründung und Rückgängig

## 0.3 – Konto & Teilen

- Eigene Touren aus Favoriten erstellen, benennen und teilen

- Magic-Link-Login (E-Mail) mit Übernahme der Gastdaten (`VisitorSession.userId` ist vorbereitet)
- Nutzung auf mehreren Geräten
- Aufenthalt mit Mitreisenden teilen (Lesezugriff über signierten, widerrufbaren Link)
- Agenda als Kalenderdatei exportieren (`.ics`)
- Ratenbegrenzung für Schreibzugriffe, Nonce-basierte CSP

## 0.4 – Inhalte & Redaktion

- Schlanke Redaktionsoberfläche oder Headless-CMS für Orte und Veranstaltungen
- Veranstaltungen mit konkreten Terminen (Anbindung an den Veranstaltungskalender von Baden Tourismus, sofern eine Schnittstelle verfügbar ist)
- Mehr lizenzierte Fotografie, z. B. in Partnerschaft mit lokalen Fotografinnen und Fotografen
- Kartenansicht mit datenschutzfreundlichen Kacheln (z. B. swisstopo)
- Öffnungszeiten strukturiert (heute geöffnet / geschlossen)

## 0.5 – Partner & weitere Sprachen

- Französisch (Architektur vorbereitet: neues Wörterbuch + Übersetzungen genügen)
- Weitere Thementouren, z. B. «Baden bei Regen», «Industriegeschichte (BBC/ABB)», saisonale Touren
- Hotel-Integration: Gästeinformationen und Empfehlungen direkt vom Haus, QR-Code im Zimmer, der den Aufenthalt vorbereitet
- Wetterabhängige Vorschläge («Auch bei Regen» ist im Datenmodell bereits enthalten)
- Weitere Städte (das `City`-Modell ist vorbereitet)

## Später

- Persona «Einwohnerinnen und Einwohner» und «Berufstätige» (Mittagstipps, Stadtservices)
- Optionale Offline-Verfügbarkeit des eigenen Aufenthalts (verschlüsselt, nur auf dem Gerät)
- Native Apps nur, wenn die PWA nachweisbar an Grenzen stösst

## Bewusste Nicht-Ziele (MVP)

Hotelbuchung, Ticketverkauf, Online-Zahlungen, KI-Reiseplanung, Chatbot, Social Network, Push-Benachrichtigungen, Behördenportal, Live-Verkehrsdaten, umfangreiches CMS, native Apps.
