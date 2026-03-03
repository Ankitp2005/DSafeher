# 🛡️ SafeHer — Women Safety Alert System

> **"Walk fearless. We've got your back."**

SafeHer is an open-source mobile safety application built for women. One hold of a button instantly shares your live GPS location with emergency contacts, sends SOS alerts via SMS, and activates a real-time tracking system — even when your phone has no internet, even when the app is closed.

---

## 🌟 Why SafeHer Exists

Every 16 minutes, a crime against a woman is reported in India.

86% of women feel unsafe in public spaces after dark. Most of them carry that fear silently — on late-night commutes, in unfamiliar areas, in situations they can't easily escape. Existing solutions either require stable internet, full phone access, or visible action — all of which can be prevented in a real emergency.

SafeHer was built to close that gap. Not as a feature-rich tech product, but as a lifeline that works when everything else fails.

---

## ✨ Features

### 🔴 SOS Alert System
- Hold the SOS button for 3 seconds to trigger an emergency alert
- Alternative triggers: power button 5x, shake gesture, voice command ("Help" / "Bachao")
- Simultaneously sends SMS, WhatsApp, and push notifications to all emergency contacts
- Live GPS tracking activates instantly — contacts see your real-time location on a map
- Works fully offline — queues alerts and fires when connection returns
- Auto-records audio and captures front camera photos as evidence

### 📍 Live Location Tracking
- Real-time location shared with emergency contacts during active SOS
- Web tracking page — contacts open a link in any browser, no app needed
- Location trail shows last 30 minutes of movement
- Automatically stops tracking after SOS is resolved

### 🗺️ Safe Route Suggester
- Analyzes routes based on community incident reports, danger zones, time of day, and nearby police stations
- Recommends the safest path — not just the fastest
- Night mode: stricter safety scoring after 9PM
- Journey deviation detection: alerts contacts if you go off route

### 📞 Fake Call Simulator
- Simulate a realistic incoming call from "Mom", "Boss", or any custom name
- Schedule: trigger now, in 30 seconds, 1 minute, or custom delay
- Looks and sounds exactly like a real incoming call
- Escape uncomfortable situations without raising suspicion

### 👥 Community Reporting
- Anonymously report incidents: harassment, poor lighting, suspicious activity, assault
- Reports build a live safety map visible to all users
- Danger zones auto-generated when 3+ reports cluster in the same area
- Upvote system to verify reports and filter false ones

### ✅ Journey Check-In
- Set a destination and expected arrival time
- If you don't check in: emergency contacts are automatically alerted
- Escalation chain: SMS → Call → SOS if no response
- Recurring check-ins for daily commutes

### 🔒 Disguised App Mode
- App can appear as a Calculator on the home screen
- Access the real app via a secret gesture or code
- Critical for users in controlling or abusive relationships

### 👁️ Guardian Mode
- Trusted guardians can passively monitor your safety
- Real-time location visible to guardian during journeys
- Alerts sent to guardian when SOS fires or check-in is missed
- Full privacy controls — pause or revoke guardian access anytime

---

## 📱 Screenshots

```
Coming soon — app in active development
```

---

## 🛠️ Tech Stack

### Mobile
- **React Native + Expo** — Cross-platform (Android + iOS)
- **TypeScript** — Type-safe codebase
- **Expo Router** — File-based navigation
- **NativeWind** — Tailwind styling for mobile
- **Zustand** — State management
- **React Query** — API data fetching

### Backend
- **Node.js + Express** — REST API server
- **Prisma** — Database ORM
- **Bull + Redis** — Background jobs and queues
- **JWT** — Secure authentication

### Database
- **PostgreSQL + PostGIS** — Main database with geospatial support
- **Supabase** — Hosted database, auth, and realtime
- **Redis** — OTP storage and rate limiting

### Third Party Services
- **Twilio** — SOS SMS alerts
- **Firebase FCM** — Push notifications
- **Google Maps API** — Maps and routing
- **Supabase Storage** — Evidence files

### DevOps
- **GitHub Actions** — CI/CD pipeline
- **Railway / Fly.io** — Backend hosting
- **EAS Build** — Mobile app builds
- **Cloudflare** — CDN and DDoS protection

---

## 🚀 Getting Started

### Prerequisites
```bash
Node.js 20+
npm or yarn
Expo CLI
Git
```

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/safeher.git
cd safeher
```

### 2. Install Dependencies
```bash
# Mobile app
cd mobile
npm install

# Backend
cd ../backend
npm install
```

### 3. Set Up Environment Variables

```bash
# Mobile
cp mobile/.env.example mobile/.env

# Backend
cp backend/.env.example backend/.env
```

Fill in the required values — see [Environment Setup Guide](docs/env-guide.md) for instructions on getting each key.

### 4. Set Up the Database
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### 5. Start Development Servers
```bash
# Start backend
cd backend
npm run dev

# Start mobile app (new terminal)
cd mobile
npx expo start
```

Scan the QR code with Expo Go on your Android or iOS device.

---

## 📁 Project Structure

```
safeher/
├── mobile/                  # React Native Expo app
│   ├── app/                 # Screens (Expo Router)
│   │   ├── (auth)/          # Login, OTP, onboarding
│   │   ├── (tabs)/          # Main app tabs
│   │   └── sos/             # SOS flow screens
│   ├── components/          # Reusable UI components
│   ├── services/            # API calls, location, SMS
│   ├── store/               # Zustand state stores
│   └── hooks/               # Custom React hooks
│
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── middleware/       # Auth, rate limiting
│   │   └── utils/           # Helpers
│   └── prisma/              # Database schema
│
└── docs/                    # Project documentation
    ├── MASTER.md            # Full project reference
    ├── sos-context.md       # SOS system details
    └── database-schema.md  # DB schema reference
```

---

## 🔐 Security

SafeHer handles sensitive personal safety data. Security is not optional.

- All JWT tokens stored in device SecureStore (never AsyncStorage)
- OTPs generated using cryptographically secure `crypto.randomInt()`
- All evidence files encrypted with AES-256 before upload
- Anonymous reports never store user identity
- Location data auto-deleted after 30 days
- Full audit log of all sensitive actions
- Certificate pinning on all API calls

Found a security vulnerability? Please do NOT open a public issue. Email us at **security@safeher.app** and we'll respond within 24 hours.

---

## 🤝 Contributing

We welcome contributions — especially from women developers who understand the problem firsthand.

```bash
# 1. Fork the repository
# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes
# 4. Run tests
npm test

# 5. Commit with a clear message
git commit -m "feat: add voice trigger for SOS"

# 6. Push and open a pull request
git push origin feature/your-feature-name
```

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a PR.

### Priority Areas for Contribution
- 🌐 Language translations (Hindi, Tamil, Telugu, Marathi, Bengali)
- 📱 Testing on low-end Android devices
- 🗺️ Improving the safety scoring algorithm
- ♿ Accessibility improvements (VoiceOver, TalkBack)
- 🧪 Writing test cases for the SOS flow

---

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run mobile tests
cd mobile
npm test

# Run E2E tests (requires physical device)
cd mobile
npx detox test
```

### Critical Tests (Must Pass Before Every Release)
- SOS triggers within 3 seconds of button hold
- SMS delivered to contacts within 30 seconds
- SOS fires when app is completely closed
- SOS works with no internet connection
- Location tracking survives 6+ hours continuously

---

## 📊 Roadmap

### Version 1.0 — MVP (Current)
- [x] Project architecture and database schema
- [ ] Phone authentication with OTP
- [ ] Emergency contacts management
- [ ] SOS button with SMS alerts
- [ ] Live location tracking
- [ ] Web tracking page for contacts
- [ ] Fake call simulator
- [ ] Basic community reporting map

### Version 1.5
- [ ] Safe route suggester
- [ ] Journey check-in system
- [ ] Guardian mode
- [ ] Evidence recording (audio + photo)
- [ ] Disguised app mode

### Version 2.0
- [ ] AI-powered threat detection
- [ ] Fall detection
- [ ] Direct police integration
- [ ] Multi-language support (Hindi, Tamil, Telugu)
- [ ] Offline map caching
- [ ] School and corporate deployment mode

### Future
- [ ] State police API integration
- [ ] Wearable device support (Apple Watch, WearOS)
- [ ] Community verified safe places
- [ ] B2B dashboard for organizations

---

## 🌍 Supported Languages

| Language | Status |
|---|---|
| English | ✅ Available |
| Hindi | 🔄 In Progress |
| Tamil | 📋 Planned |
| Telugu | 📋 Planned |
| Marathi | 📋 Planned |
| Bengali | 📋 Planned |

---

## 📞 Emergency Numbers (India)

These are built into SafeHer and accessible with one tap:

| Service | Number |
|---|---|
| National Emergency | 112 |
| Police | 100 |
| Women Helpline (National) | 181 |
| Women Helpline (UP) | 1090 |
| Ambulance | 108 |
| Domestic Violence Helpline | 181 |

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

Free to use, modify, and distribute. If you build something with SafeHer, we'd love to know about it.

---

## 🙏 Acknowledgements

Built with the belief that technology should protect the people who need it most.

Inspired by every woman who has ever held her keys between her fingers walking to her car at night. By every girl who has texted "just got home" to someone who was waiting. By every woman who has taken a longer, busier route because the shortcut didn't feel safe.

This is for them.

---

## 📬 Contact

- **Website:** safeher.app
- **Email:** hello@safeher.app
- **Security Issues:** security@safeher.app
- **Twitter/X:** @SafeHerApp

---

<div align="center">

**SafeHer — Walk fearless. We've got your back.**

⭐ Star this repo if you believe every woman deserves to feel safe.

</div>
