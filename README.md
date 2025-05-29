# borgboklund.se - Hemdashboard

En komplett, produktionsklar hemdashboard för borgboklund.se med TypeScript, Tailwind CSS och fullt funktionella API-integrationer.

## 🏠 Översikt

Detta är en personlig hemdashboard som visar:

- **SMHI Väderprognos** - Aktuellt väder och 7-dagars prognos för Norrköping
- **Kollektivtrafik** - Avgångar och ankomster från/till Klinga station
- **Trafikläget** - Störningar och vägarbeten runt Norrköping
- **Trädgård & Odling** - Jordförhållanden och pollennivåer

## 🚀 Snabbstart

### 1. Installation

```bash
# Klona projektet
git clone <repository-url>
cd borgboklund

# Installera dependencies
npm install

# Starta utvecklingsservern
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000) för att se dashboarden.

### 2. Miljövariabler

Skapa en `.env.local` fil i projektets rot:

```env
# ResRobot API (Kollektivtrafik)
NEXT_PUBLIC_RESROBOT_API_KEY=din_resrobot_api_nyckel

# Trafikverket API (Trafikstörningar)
NEXT_PUBLIC_TRAFIKVERKET_API_KEY=din_trafikverket_api_nyckel
```

## 🔑 API-nycklar Setup

### SMHI Väder API

- **Kostnad**: GRATIS
- **Registrering**: Ingen registrering krävs
- **Gräns**: Obegränsad
- **Dokumentation**: [SMHI Öppna Data](https://opendata.smhi.se/)

SMHI API:t kräver ingen API-nyckel och används direkt.

### ResRobot API (Kollektivtrafik)

- **Kostnad**: GRATIS (Bronze nivå)
- **Gräns**: 10,000 anrop/månad
- **Registrering**: Krävs

#### Steg-för-steg:

1. Gå till [Trafiklab](https://www.trafiklab.se/)
2. Skapa ett konto
3. Gå till "Mina projekt" → "Skapa nytt projekt"
4. Lägg till "ResRobot - Reseplanerare" API:t
5. Välj "Bronze" nivån (gratis)
6. Kopiera API-nyckeln till `.env.local`

### Trafikverket API (Trafikstörningar)

- **Kostnad**: GRATIS
- **Gräns**: Obegränsad för personlig användning
- **Registrering**: Krävs

#### Steg-för-steg:

1. Gå till [Trafikverkets API Portal](https://api.trafikinfo.trafikverket.se/)
2. Registrera ett konto
3. Logga in och gå till "Mina sidor"
4. Skapa en ny applikation
5. Kopiera API-nyckeln till `.env.local`

## 🎨 Design & Funktioner

### Smart Refresh System

- **Dag-läge** (06:00-23:00): Normala uppdateringsintervaller
- **Natt-läge** (23:00-06:00): Reducerade intervaller för att spara API-anrop
- **Cache**: localStorage med automatisk rensning

### Uppdateringsintervaller

- **Väder**: 10 minuter (dag) / 60 minuter (natt)
- **Kollektivtrafik**: 5 minuter (dag) / 60 minuter (natt)
- **Trafikläge**: 10 minuter (dag) / 60 minuter (natt)
- **Trädgård**: 30 minuter (dag) / 60 minuter (natt)

### Glassmorfism Design

- Djupblå gradient bakgrund
- Transparenta kort med backdrop-blur
- Smooth animationer och hover-effekter
- Responsiv design (mobile-first)

## 📱 Responsiv Layout

```
Desktop (lg+):     [Väder (2x)] [Transport] [Traffic] [Garden]
Tablet (md):       [Väder (2x)] [Transport] [Traffic] [Garden]
Mobile (sm):       [Väder] [Transport] [Traffic] [Garden]
```

## 🛠️ Teknisk Stack

- **Framework**: Next.js 15 med App Router
- **Språk**: TypeScript
- **Styling**: Tailwind CSS 4
- **State**: React Hooks
- **Cache**: localStorage
- **API:er**: SMHI, ResRobot, Trafikverket

## 📁 Projektstruktur

```
src/
├── app/
│   ├── layout.tsx          # Root layout med metadata
│   ├── page.tsx            # Huvuddashboard
│   └── globals.css         # Global styling
├── components/
│   ├── Header.tsx          # Minimal header
│   ├── WeatherCard.tsx     # SMHI väderdata
│   ├── TransportCard.tsx   # ResRobot kollektivtrafik
│   ├── TrafficCard.tsx     # Trafikverket störningar
│   └── GardenCard.tsx      # Trädgård & pollennivåer
├── lib/
│   ├── api/
│   │   ├── smhi.ts         # SMHI API integration
│   │   ├── resrobot.ts     # ResRobot API integration
│   │   ├── trafikverket.ts # Trafikverket API integration
│   │   └── garden.ts       # Mock trädgårdsdata
│   └── utils/
│       ├── timeUtils.ts    # Tid och datum funktioner
│       └── cache.ts        # localStorage cache
└── types/
    ├── weather.ts          # Väder TypeScript types
    ├── transport.ts        # Transport TypeScript types
    ├── traffic.ts          # Trafik TypeScript types
    └── garden.ts           # Trädgård TypeScript types
```

## 🔧 Felsökning

### API-problem

#### SMHI API fungerar inte

- Kontrollera internetanslutning
- SMHI API:t kräver ingen nyckel, så det borde fungera direkt
- Kolla browser console för felmeddelanden

#### ResRobot API fel

```bash
# Vanliga fel:
# 401 Unauthorized - Fel API-nyckel
# 429 Too Many Requests - API-gräns nådd
# 403 Forbidden - API-nyckel inte aktiverad
```

**Lösningar:**

1. Kontrollera att API-nyckeln är korrekt i `.env.local`
2. Verifiera att Bronze-nivån är aktiverad på Trafiklab
3. Vänta om du nått API-gränsen (10,000/månad)

#### Trafikverket API fel

```bash
# Vanliga fel:
# 401 Unauthorized - Fel API-nyckel
# 400 Bad Request - Fel XML-format
```

**Lösningar:**

1. Kontrollera API-nyckeln på Trafikverkets portal
2. Säkerställ att applikationen är aktiverad

### Cache-problem

```bash
# Rensa localStorage cache
localStorage.clear()

# Eller specifikt för borgboklund
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('borgboklund_')) {
    localStorage.removeItem(key);
  }
});
```

### Build-problem

```bash
# Rensa Next.js cache
npm run build
# eller
rm -rf .next
npm run build
```

## 🚀 Deployment

### Vercel (Rekommenderat)

1. Pusha koden till GitHub
2. Importera projektet på [Vercel](https://vercel.com)
3. Lägg till miljövariabler i Vercel dashboard
4. Deploy automatiskt

### Andra plattformar

```bash
# Bygg för produktion
npm run build

# Starta produktionsserver
npm start
```

## 📊 API-kostnader & Gränser

| API          | Kostnad | Gräns        | Backup    |
| ------------ | ------- | ------------ | --------- |
| SMHI         | Gratis  | Obegränsad   | Nej       |
| ResRobot     | Gratis  | 10,000/månad | Mock-data |
| Trafikverket | Gratis  | Obegränsad\* | Mock-data |
| Trädgård     | Mock    | N/A          | Alltid    |

\*Trafikverket: "Rimlig användning" för personliga projekt

## 🎯 Funktioner

### ✅ Implementerat

- [x] SMHI väderprognos med 7-dagars forecast
- [x] Vädervarningar från SMHI
- [x] ResRobot kollektivtrafik (avgångar/ankomster)
- [x] Trafikverket störningar och vägarbeten
- [x] Mock trädgårdsdata med pollennivåer
- [x] Smart refresh system (dag/natt-lägen)
- [x] localStorage cache
- [x] Responsiv glassmorfism design
- [x] Error handling med fallbacks
- [x] TypeScript genom hela projektet

### 🔮 Framtida förbättringar

- [ ] Riktiga jordbruksdata från Lantmäteriet
- [ ] Push-notifikationer för vädervarningar
- [ ] Historisk data och trender
- [ ] Anpassningsbara kort-layout
- [ ] Dark/light mode toggle
- [ ] PWA-funktionalitet
- [ ] Offline-läge

## 🤝 Bidrag

Detta är ett privat hemdashboard-projekt, men förslag och förbättringar är välkomna!

## 📄 Licens

Privat projekt - Alla rättigheter förbehållna Boklund Family.

## 📞 Support

För tekniska frågor eller API-problem:

1. Kontrollera denna README först
2. Kolla browser console för felmeddelanden
3. Verifiera API-nycklar och konfiguration
4. Testa med mock-data för att isolera problemet

---

**Skapad med ❤️ för Borg Boklund, Norrköping**
