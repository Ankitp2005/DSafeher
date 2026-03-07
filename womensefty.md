# 🛡️ Women Safety Alert System — Complete Implementation Prompts + Master Reference

---

# PART 1: IMPLEMENTATION PROMPTS (Feature by Feature)

---

## 🔴 FEATURE 1: Project Foundation & Setup

### Prompt 1.1 — Project Scaffold & Tech Stack Setup

```
You are a senior mobile engineer setting up a production-ready React Native (Expo) 
project for a Women Safety Alert System called "SafeHer".

Tech Stack:
- Mobile: React Native with Expo SDK 51
- Backend: Node.js + Express
- Database: PostgreSQL (via Supabase)
- Real-time: Supabase Realtime
- Maps: Google Maps SDK / Mapbox
- SMS: Twilio
- Push Notifications: Expo Notifications + Firebase Cloud Messaging
- Location: expo-location
- Auth: Supabase Auth

Create a complete project scaffold with this monorepo structure:

safeher/
├── mobile/               # Expo React Native app
│   ├── app/              # Expo Router (file-based routing)
│   │   ├── (auth)/       # Login, Signup, Onboarding
│   │   ├── (tabs)/       # Main app tabs
│   │   ├── sos/          # SOS flow screens
│   │   └── _layout.tsx
│   ├── components/
│   │   ├── sos/          # SOS button, countdown, confirmation
│   │   ├── map/          # Map views, route display
│   │   ├── contacts/     # Emergency contacts management
│   │   ├── community/    # Report incident, view reports
│   │   └── shared/       # Reusable UI components
│   ├── hooks/
│   ├── services/         # API calls, location, SMS
│   ├── store/            # Zustand state management
│   ├── constants/        # Colors, fonts, config
│   └── utils/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── models/
│   │   └── utils/
│   ├── prisma/
│   │   └── schema.prisma
│   └── Dockerfile
└── docs/

Also generate:
- Complete package.json for mobile (all dependencies with versions)
- Complete package.json for backend
- app.json for Expo configuration with all permissions declared:
  * Location (foreground + background)
  * Contacts access
  * Microphone (for fake call)
  * Camera (for incident reporting)
  * Notifications
- .env.example for both mobile and backend
- /docs/architecture.md explaining system design
- docker-compose.yml for local backend development

Critical requirements:
- Background location tracking must work even when app is closed
- Push notifications must work even when app is killed
- SOS must be triggerable within 2 taps maximum
- All permissions must have clear user-facing explanations in app.json
```

---

### Prompt 1.2 — Database Schema (Supabase/PostgreSQL)

```
You are a senior database architect designing a complete PostgreSQL schema 
for "SafeHer" — a Women Safety Alert System.

Create complete SQL with all tables, relationships, indexes, and 
Row-Level Security policies:

1. users
   - id (UUID, PK)
   - phone_number (unique, NOT NULL) — primary identifier
   - full_name
   - email (optional)
   - profile_photo_url
   - home_address (encrypted)
   - work_address (encrypted)
   - is_verified (phone verification)
   - is_active
   - last_seen_at
   - created_at

2. emergency_contacts
   - id, user_id (FK), name, phone_number, relationship
   - is_primary (bool — gets SMS first)
   - notify_on_sos (bool)
   - notify_on_route_deviation (bool)
   - notify_on_check_in_missed (bool)
   - added_at, verified_at (when contact confirmed their number)

3. sos_alerts
   - id, user_id (FK)
   - trigger_type ('button', 'shake', 'voice', 'auto_detect')
   - status ('active', 'resolved', 'false_alarm', 'cancelled')
   - triggered_at, resolved_at
   - initial_latitude, initial_longitude
   - resolution_notes
   - contacts_notified (JSONB array of contact IDs + notification status)

4. location_tracking
   - id, sos_alert_id (FK), user_id (FK)
   - latitude, longitude, accuracy, speed, heading
   - battery_level
   - recorded_at
   - (high-frequency table — partition by month)

5. safe_routes
   - id, user_id (FK)
   - origin_name, destination_name
   - origin_lat, origin_lng, destination_lat, destination_lng
   - route_polyline (TEXT — encoded polyline)
   - safety_score (0-100)
   - is_saved (user bookmarked)
   - created_at

6. community_reports
   - id, reported_by_user_id (FK — nullable for anonymous)
   - incident_type ('harassment', 'poor_lighting', 'suspicious_activity', 
                    'unsafe_area', 'assault', 'following', 'other')
   - description (optional, 500 chars max)
   - latitude, longitude
   - location_accuracy_meters
   - photo_url (optional, evidence)
   - is_anonymous (bool)
   - is_verified (moderated)
   - upvote_count
   - reported_at
   - expires_at (auto-expire after 7 days for minor incidents, 30 days for serious)

7. report_upvotes
   - id, report_id (FK), user_id (FK)
   - upvoted_at
   - UNIQUE(report_id, user_id)

8. fake_calls
   - id, user_id (FK)
   - contact_name (custom name shown on fake incoming call screen)
   - delay_seconds (0, 10, 30, 60, 120)
   - scheduled_at, triggered_at

9. check_ins
   - id, user_id (FK)
   - destination_name
   - expected_arrival_at
   - check_in_window_minutes (grace period)
   - status ('pending', 'checked_in', 'missed', 'sos_triggered')
   - contacts_to_notify (JSONB)
   - created_at

10. danger_zones (aggregated from community reports)
    - id
    - center_latitude, center_longitude
    - radius_meters
    - danger_level ('low', 'medium', 'high', 'critical')
    - incident_count
    - last_incident_at
    - is_active

11. safe_places (verified safe locations)
    - id
    - name (e.g., "City Police Station - MG Road")
    - place_type ('police_station', 'hospital', 'fire_station', 
                  'safe_haven_shop', 'women_helpdesk')
    - latitude, longitude
    - phone_number
    - is_24_hours
    - verified_by_admin

12. audit_logs
    - id, user_id (FK), action, metadata (JSONB), created_at
    (for security auditing — who accessed what)

Generate:
- Full SQL CREATE TABLE statements with all constraints
- All indexes (especially on lat/lng for geospatial queries)
- Enable PostGIS extension for geospatial queries
- RLS policies for each table
- Trigger to auto-create emergency_contacts and daily_streak records on user insert
- Seed data: 20 safe_places in a major Indian city
- Seed data: 5 different incident_types for community_reports
- /docs/database-schema.md with ERD description
```

---

## 🔴 FEATURE 2: Authentication & Onboarding

### Prompt 2.1 — Phone Number Authentication

```
You are a senior mobile engineer building phone-based authentication 
for "SafeHer" — a women's safety app.

Phone number is the ONLY primary auth method (no email login — 
safety apps must be accessible even with no email account).

Build complete auth system:

Backend — /src/routes/auth.js:

1. POST /api/auth/send-otp
   - Accept: phone_number (with country code)
   - Validate: international phone format
   - Generate 6-digit OTP (crypto.randomInt, NOT Math.random)
   - Store OTP in Redis with 10-minute TTL
   - Send via Twilio Verify or SMS
   - Rate limit: max 3 OTP requests per phone per hour
   - Anti-abuse: block numbers that request OTP > 10 times/day
   - Return: { success: true, expires_in: 600 }

2. POST /api/auth/verify-otp
   - Accept: phone_number, otp
   - Verify against Redis
   - Delete OTP after successful verification (single use)
   - If new user: create user record, return is_new_user: true
   - If existing user: return user profile
   - Issue JWT (access: 24h) + refresh token (30 days)
   - Log auth event in audit_logs

3. POST /api/auth/refresh
   - Accept refresh token
   - Issue new access token

4. POST /api/auth/logout
   - Invalidate refresh token

Mobile — /app/(auth)/ screens:

PhoneInputScreen:
- Large phone number input with country code picker
- Flag emoji + country code prefix
- Auto-format as user types
- "Send OTP" button (shows loading)
- Clear error states for invalid numbers

OTPVerificationScreen:
- 6-box OTP input (auto-advance, auto-paste from SMS)
- Countdown timer: "Resend in 45s"
- Resend button (active after countdown)
- Auto-submit when all 6 digits entered
- Biometric re-auth for returning users (Face ID/Fingerprint)

Also build:
- /hooks/useAuth.ts — auth state, login, logout functions
- JWT stored in Expo SecureStore (NOT AsyncStorage — security critical)
- Biometric authentication for app reopen (LocalAuthentication)
- Session persistence — user stays logged in for 30 days
- /services/authService.ts — all API calls

Security requirements:
- OTP must be cryptographically random (not predictable)
- JWT stored in SecureStore only
- Certificate pinning for API calls (to prevent MITM)
- Jailbreak/root detection warning (using expo-device)

Output:
- Complete backend auth routes with security
- Complete mobile screens
- All hooks and services
- /docs/auth-security.md
```

---

### Prompt 2.2 — Onboarding Flow

```
You are a senior UX engineer building the critical onboarding flow 
for "SafeHer". 

Onboarding sets up the app's core safety features. 
It must be completed before the user can use the app.
It should feel reassuring, not scary.

Build complete 5-step onboarding:

Step 1 — Welcome & Permissions:
- Screen: "SafeHer keeps you safe. Always."
- Explanation of what permissions are needed and WHY:
  * Location: "To share your position with contacts during SOS"
  * Contacts: "To let you choose who to alert"
  * Notifications: "To receive check-in reminders"
  * Microphone: "For the fake call feature"
- Request permissions one by one (with explanation before each request)
- If permission denied: explain impact, offer to continue with limited features
- NEVER block app use for denied permissions — degrade gracefully

Step 2 — Emergency Contacts Setup:
- Add 1-5 emergency contacts (minimum 1 required)
- Options: 
  a) Import from phone contacts
  b) Enter manually (name + phone)
- For each contact: set relationship label
- Toggle: notify on SOS? (default ON)
- Toggle: notify if check-in missed? (default ON)
- "Test notification" button (sends "SafeHer: [Name] has added you as an emergency contact" SMS)
- Skip: NOT allowed (at least 1 contact required for safety)

Step 3 — Home & Work Address:
- Set home address (for safe route suggestions)
- Set work address (optional)
- Map picker with search
- Stored encrypted locally and in backend
- These are used for pre-calculating safe routes

Step 4 — SOS Trigger Preferences:
- Choose SOS activation methods:
  □ Power button: press 5 times quickly (default ON)
  □ Shake gesture: shake phone 3 times (default ON)  
  □ Voice trigger: shout "Help" (optional, drains battery)
  □ Big SOS button (always available)
- Set countdown timer: 3 / 5 / 10 seconds before SOS fires
  (gives time to cancel false alarms)
- Enable/disable: auto-record audio during SOS
- Enable/disable: auto-take front camera photo every 30 seconds during SOS

Step 5 — Fake Call Setup:
- Enter default "caller name" (e.g., "Mom", "Boss")
- Optional: record custom ringtone or use default
- Show demo of fake call screen
- Explanation: "Use this to excuse yourself from uncomfortable situations"

Complete screen:
- Summary of setup
- Emergency contacts listed
- Download offline maps option (for areas with poor connectivity)
- "You're protected. Stay safe." message

Build:
- All 5 onboarding screens with progress indicator
- /store/onboardingStore.ts — track completion state
- Skip/back navigation with confirmation dialogs
- onboarding_completed flag set in user profile on backend
- If user force-closes: resume from last step

Output:
- All screen components
- Store with persistence
- Backend endpoint to save onboarding data
- Permission handling utility
```

---

## 🔴 FEATURE 3: SOS Alert System (CORE FEATURE)

### Prompt 3.1 — SOS Button & Trigger System

```
You are a senior mobile engineer building the core SOS system 
for "SafeHer" — a women's safety application.

This is the MOST CRITICAL feature of the entire app.
It must work with ZERO failures. Even with no internet. Even in background.

Build the complete SOS trigger system:

1. /components/sos/SOSButton.tsx — The Main SOS Button:
   - Large red circle button, always visible on home screen
   - Press and HOLD for 3 seconds to trigger (prevents accidental activation)
   - Visual countdown ring fills up during hold (animated SVG progress ring)
   - Haptic feedback throughout hold duration
   - Countdown: 3...2...1...SOS ACTIVATED
   - Can be placed as floating button on any screen
   - Accessibility: large enough for trembling hands (min 80x80 dp)

2. /services/sosService.ts — SOS Service:
   
   SOS Triggers (all route to the same triggerSOS() function):
   a) Button hold (3 seconds)
   b) Power button: 5 rapid presses (detect via AppState + volume key events)
   c) Shake gesture: 3 rapid shakes (use accelerometer)
   d) Voice: detect "Help" or "Bachao" (Hindi) — only when screen is on
   e) Auto-trigger: if location doesn't change for 2+ hours at night (10PM-6AM)
      and user hasn't opened app

   triggerSOS(trigger_type: string) flow:
   1. Show countdown modal (cancelable for N seconds — user's preference)
   2. Start background location tracking (every 10 seconds)
   3. Call POST /api/sos/trigger
   4. Simultaneously (parallel, not sequential):
      a) Send SMS to all emergency contacts via Twilio
      b) Send push notifications to contacts with the app
      c) Call police helpline automatically (optional, user setting) 
      d) Start audio recording (if enabled) to device storage
      e) Start periodic camera captures (front camera, if enabled)
      f) Share live location link
   5. Keep SOS active until manually resolved
   6. If internet fails: queue actions, retry with exponential backoff
   7. OFFLINE MODE: Store SOS trigger locally, retry when back online

3. /components/sos/SOSCountdownModal.tsx:
   - Large countdown timer (5 by default)
   - "Cancel" button (large, accessible)
   - "Send Now" button (skip countdown)
   - Shows who will be notified
   - Plays alarm sound during countdown
   - Cannot be dismissed by back button

4. /components/sos/ActiveSOSScreen.tsx:
   - Full screen red UI (unmissable)
   - Live location sharing indicator
   - List of contacts notified + status (SMS sent ✓, Push sent ✓)
   - "I'm Safe" button (requires double confirmation — "Are you sure?")
   - Battery level shown (critical info during emergency)
   - Record button (manual audio recording)
   - Share live location link button (shareable URL)
   - Emergency numbers quick dial (100, 112, 1090 for India)
   - Timer: "SOS active for 00:05:32"

5. Offline Resilience:
   - IndexedDB / SQLite queue for failed API calls
   - SMS can be triggered via device SMS API directly (as backup)
   - Twilio webhook to retry failed SMS deliveries
   - Location stored locally, synced when back online

Backend — POST /api/sos/trigger:
   - Create sos_alert record
   - Trigger Twilio SMS to all emergency contacts with:
     "🚨 EMERGENCY ALERT: [Name] needs help! 
      Live location: https://safeher.app/track/[token]
      Triggered at: [time]
      Call her: [phone]
      Reply SAFE to this number when she's safe."
   - Generate unique tracking token (short-lived, 6 hours)
   - Send push notifications
   - Return: alert_id, tracking_token, contacts_notified

Backend — POST /api/sos/:alert_id/location:
   - Accept: latitude, longitude, accuracy, battery_level
   - Store in location_tracking table
   - Broadcast via Supabase Realtime to all tracking the alert

Backend — PUT /api/sos/:alert_id/resolve:
   - Update status to 'resolved' or 'false_alarm'
   - Send "safe" notification to all contacts
   - Stop location tracking

Output:
- Complete SOS service with all trigger methods
- All screen components
- Backend routes with error handling
- Offline queue implementation
- /docs/sos-system.md with full flow diagram
- Test scenarios for each trigger method
```

---

### Prompt 3.2 — Live Location Sharing & Tracking

```
You are a senior engineer building the live location sharing system 
for "SafeHer" SOS alerts.

When SOS is triggered, emergency contacts must see real-time 
location on a map — even without the app installed.

Build complete location tracking system:

1. Mobile — /services/locationService.ts:

   startSOSTracking(alertId):
   - Start background location tracking via expo-location
   - Task registered with TaskManager (survives app close)
   - Update frequency: every 10 seconds during active SOS
   - Normal tracking: every 60 seconds
   - Send to: POST /api/sos/:id/location
   - Battery optimization: reduce to 30-second intervals if battery < 20%
   - Include: latitude, longitude, accuracy, speed, heading, battery_level

   Location accuracy tiers:
   - High accuracy (GPS): during active SOS
   - Balanced: during journey tracking / check-in mode
   - Low power: background health check

2. Backend — /src/routes/tracking.js:
   
   GET /track/:token (PUBLIC — no auth required, accessible to contacts):
   - Validate token is valid and not expired
   - Return: alert info, user's last 10 locations, contact-to-contact info
   - This powers the web tracking page

   Real-time via Supabase Realtime:
   - Subscribe to location_tracking table for specific alert_id
   - Contacts receive updates in real-time on tracking page

3. /public/track/[token].html — Web Tracking Page:
   (A standalone web page contacts can open in any browser — no app needed)
   - Shows Google Map with user's live location (pulsing dot)
   - Location trail (last 30 minutes shown as line)
   - "Last updated: X seconds ago"
   - User's name and profile photo (if shared)
   - Alert duration timer: "Alert active for 23 minutes"
   - Emergency contact info shown (so contacts can coordinate)
   - "Mark Safe" button (if contact is trusted and verifies by phone)
   - Auto-refresh via Supabase Realtime WebSocket
   - Works fully on mobile browser
   - Speed and heading indicator (helps contacts understand movement)
   - If location stops updating > 2 minutes: show warning "Location lost"
   - Page shows: "Do not share this link with others"

4. Battery optimization strategy:
   - Warn user if battery < 30% during active SOS
   - Reduce photo capture frequency if battery < 20%
   - Switch to low-power location if battery < 10%
   - Show battery level to emergency contacts on tracking page

5. Location privacy rules:
   - Tracking tokens expire after SOS resolved + 1 hour
   - No location history stored after 7 days
   - User can delete their location history
   - Tracking page shows name only (not full phone number)

6. /components/map/LiveTrackingMap.tsx (for contacts who have app):
   - In-app version of the tracking page
   - Integrates with contacts' app
   - Can send messages to the person in distress

Output:
- Complete locationService.ts with background task
- Backend tracking routes
- Web tracking page (mobile-optimized HTML/CSS/JS)
- Supabase Realtime integration
- Battery optimization logic
- /docs/location-privacy.md
```

---

### Prompt 3.3 — SMS & Notification System

```
You are a senior engineer building the alert notification system 
for "SafeHer".

When SOS triggers, contacts MUST be reached. Build a 
multi-channel notification system with failover.

Build complete notification infrastructure:

1. Backend — /src/services/notificationService.js:

   Primary channel — Twilio SMS:
   - Send immediately on SOS trigger (no queue, direct call)
   - SMS template:
     "🚨 EMERGENCY ALERT
      [User Name] has triggered an emergency!
      📍 Live tracking: https://safeher.app/track/[TOKEN]
      ⏰ Alert triggered: [TIME]
      📞 Call her: [PHONE]
      
      Reply SAFE when she's confirmed safe.
      Reply HELP to send your location to her."
   
   Secondary channel — Push notifications (if contact has app):
   - Via Firebase Cloud Messaging
   - High priority notification (bypasses Do Not Disturb on Android)
   - Critical alert on iOS (requires special entitlement)
   - Notification action buttons: "Track Live" | "Call Now"
   
   Tertiary channel — WhatsApp (via Twilio WhatsApp API):
   - As final fallback
   - Include location as WhatsApp location message (native format)
   
   Failover logic:
   - If SMS fails: retry 3 times in 30 seconds
   - If all SMS fail: trigger push notification + log failure
   - If push fails: log, alert admin
   - Track delivery status for each contact
   - Show delivery status on ActiveSOSScreen

2. /src/services/twilioService.js:
   - Initialize Twilio client
   - sendSOS(to, userName, trackingUrl, userPhone) function
   - sendSafeAlert(to, userName) — when user marks safe
   - sendCheckInMissedAlert(to, userName, destination) — for check-ins
   - sendContactVerification(to, contactName, addedByName)
   - SMS status webhook handler (delivery receipts)
   - Handle Twilio errors: invalid number, number not reachable, etc.

3. /src/routes/webhooks.js:
   - POST /webhook/twilio/sms-status — Twilio delivery receipt
   - POST /webhook/twilio/incoming-sms — Handle "SAFE" replies from contacts
     * If contact replies "SAFE": update alert, notify user
     * If contact replies "HELP": capture contact's location (if they share)
   
4. Mobile — /services/pushNotificationService.ts:
   - Register device token on app launch
   - Send token to backend on login
   - Handle incoming notifications even when app is killed
   - Handle notification tap → open relevant screen (SOS, tracking, etc.)
   - Handle background notification processing

5. Emergency Dial System:
   - On SOS trigger, offer one-tap call to:
     * 112 (National Emergency — India)
     * 100 (Police)
     * 1090 (Women Helpline — UP)
     * 181 (Women Helpline — Delhi)
   - Configurable based on user's state/country
   - Log all emergency calls in audit_logs

6. Contact notification preferences:
   - Each contact can set preferences (via a contact verification link)
   - Preferred language for SMS (English, Hindi, etc.)
   - Preferred channel (SMS, WhatsApp, Call)

Output:
- Complete notification service with failover
- Twilio integration with all SMS types
- Webhook handlers
- Push notification service for mobile
- Emergency dial component
- /docs/notification-failover.md showing the failover chain
```

---

## 🔴 FEATURE 4: Fake Call Simulator

### Prompt 4.1 — Fake Call System

```
You are a senior mobile engineer building the fake call simulator 
for "SafeHer".

Purpose: Allow user to simulate an incoming call to escape uncomfortable 
or unsafe situations without raising suspicion.

Build complete fake call system:

1. /app/(tabs)/fake-call.tsx — Fake Call Setup Screen:
   - Quick-trigger section:
     "Trigger fake call in:" 
     [Now] [30s] [1 min] [5 min] [Custom]
   - Caller settings:
     * Caller name: text input (e.g., "Mom", "Boss", "Dr. Sharma")
     * Caller photo: choose from contacts or upload
     * Caller number: shown on incoming call screen
   - Ringtone: choose from device ringtones or use default
   - Call duration: how long the call lasts (60-300 seconds)
   - "Schedule Fake Call" button
   - Active fake call timer shown if scheduled

2. /components/sos/FakeCallIncomingScreen.tsx:
   This must look EXACTLY like a real Android/iOS incoming call screen.
   
   Android style:
   - Dark gradient background
   - Caller photo (large circle)
   - Caller name (large text)
   - Phone number shown below
   - "Incoming call..." animated dots
   - Swipe up to answer (green phone icon)
   - Swipe left to reject (red phone icon)
   - Phone vibrates exactly like real incoming call
   
   iOS style:
   - White rounded card design
   - Decline (red) | Accept (green) large buttons
   - Reminder and Message quick-reply options
   - Exact iOS system font and layout

   Must:
   - Appear over the lock screen (requires special Android permission)
   - Bypass Do Not Disturb mode
   - Play chosen ringtone
   - Vibrate phone
   - Show on top of all other apps

3. /components/sos/FakeCallActiveScreen.tsx — During "Call":
   - Shows like an active phone call
   - Caller name, timer counting up
   - Mute, Speaker, Keypad, Hold buttons (visual only)
   - Hangs up after set duration
   - User can "End Call" anytime
   - In background: plays a recorded one-sided conversation 
     (optional — pre-recorded audio of someone speaking naturally)
   
4. /services/fakeCallService.ts:
   - scheduleFakeCall(delaySeconds, callerConfig): void
   - Uses expo-task-manager for scheduled trigger
   - Works even when app is backgrounded
   - cancelFakeCall(): void
   - triggerFakeCallNow(): void
   - Pre-recorded audio playback (expo-av)
   - Handle incoming real call: if real call comes in, pause/cancel fake call

5. Quick-access widget:
   - Home screen widget (expo-widget) showing:
     "Fake Call in [X] min" if scheduled
     "Quick Fake Call" button
   - Shake-to-schedule: shake phone → 30-second delay fake call

6. Customization (Pro features for future):
   - Record custom caller voice message
   - Custom caller photo from gallery
   - Multiple saved caller profiles ("Mom", "Work", "Doctor")
   - Save frequently used configurations

7. Backend — /src/routes/fakeCall.js:
   - POST /api/fake-call/schedule — log fake call usage for analytics
   - GET /api/fake-call/configs — get saved caller configurations

Output:
- Complete fake call setup screen
- Exact-replica incoming call screen (both Android and iOS)
- Active call screen with timer
- Fake call service with scheduling
- Pre-recorded audio handling
- Widget implementation
- /docs/fake-call-ux.md explaining the UX decisions
```

---

## 🔴 FEATURE 5: Safe Route Suggester

### Prompt 5.1 — Safe Route Engine

```
You are a senior engineer building the safe route suggestion system 
for "SafeHer".

Routes are scored based on: time of day, community incident reports, 
lighting, police stations nearby, crowd density, and known safe places.

Build complete route system:

1. Backend — /src/services/routeService.js:

   calculateSafetyScore(route, userId, timeOfDay):
   
   Safety factors and weights:
   - Incident reports in buffer (500m): -10 per report, max -50
   - Danger zones intersected: -20 per zone
   - Police stations within 500m of route: +15 per station
   - Safe places (hospitals, fire stations) within 500m: +10
   - Street lights (if OpenStreetMap data available): +5 per lit segment
   - Time of day multiplier:
     * 6AM-8PM: 1.0x (normal)
     * 8PM-10PM: 0.8x (reduced score — penalize risky areas more)
     * 10PM-6AM: 0.6x (night mode — heavily penalize dark areas)
   - Route is on main road vs alley: +10 for main road
   - Route length penalty: shorter isn't always safer (balance safety vs speed)
   
   Final score: 0-100 (100 = safest possible)
   Label: 0-40 = Avoid, 41-70 = Caution, 71-100 = Safe

2. Backend — /src/routes/routes.js:

   POST /api/routes/suggest:
   - Accept: origin_lat, origin_lng, destination_lat, destination_lng
   - Call Google Maps Directions API to get 3 route alternatives
   - Calculate safety score for each route
   - Return routes sorted by safety score (NOT by time)
   - Each route includes:
     * polyline, distance, duration, safety_score, safety_label
     * incident_count_nearby, safe_places_nearby
     * warnings: ["2 reports of harassment near MG Road", "Poor lighting after 9PM"]
     * time-specific advice: "Safer before 8PM"

   GET /api/routes/saved:
   - Get user's saved routes

   POST /api/routes/save:
   - Save a route for quick access

   POST /api/routes/journey/start:
   - Start journey monitoring mode
   - Record origin, destination, expected duration
   - Enable route deviation detection

   POST /api/routes/journey/end:
   - End journey monitoring
   - Calculate actual vs expected time
   - Trigger check-in if not ended within time window

3. Mobile — /app/(tabs)/routes.tsx:
   
   RouteSearchScreen:
   - Search bar: "Where are you going?"
   - Current location auto-detected
   - Common destinations: Home, Work (from profile)
   - Recent destinations
   - Map showing danger zones (red heat map) and safe places (green icons)

   RouteResultsScreen:
   - 3 route cards (sorted by safety)
   - Each card shows: safety score badge, time, distance, key warnings
   - "Safest" badge on best route
   - "Fastest" badge on fastest (even if not safest)
   - Color coding: green (safe) → yellow (caution) → red (avoid)
   - "Start Journey" button (activates monitoring mode)

4. /components/map/SafeRouteMap.tsx:
   - Google Maps / Mapbox integration
   - Route overlay with safety color coding (green/yellow/red segments)
   - Danger zone overlays (semi-transparent red circles)
   - Safe place markers (green shield icons)
   - Police station markers (blue badge icons)
   - Community incident markers (orange warning icons)
   - Toggle layers: show/hide danger zones, safe places, incidents
   - Night mode styling (darker map at night)

5. Journey Monitoring Mode:
   When user starts journey:
   - Track location every 30 seconds
   - If user deviates >200m from planned route: 
     * Vibrate + notification: "You've left your route. Are you okay?"
     * 60-second response window
     * No response: send alert to emergency contacts
   - "I'm Safe" check-in button (large, accessible)
   - Auto-alert if journey exceeds expected time by >50%

6. Time-of-day route intelligence:
   - Different route recommendations at 2PM vs 11PM
   - Night routes: prefer main roads, avoid isolated shortcuts
   - Show "unsafe at night" warnings prominently
   - Suggest "travel with companion" for high-risk routes after 9PM

7. Offline support:
   - Cache last 5 route searches
   - Show cached safety data when offline
   - "Data may be outdated" warning when using cached data

Output:
- Complete route service with safety scoring algorithm
- All map components
- Journey monitoring service
- Route search and results screens
- Route deviation detection
- /docs/safety-scoring-algorithm.md explaining the formula
```

---

## 🔴 FEATURE 6: Community Reporting System

### Prompt 6.1 — Incident Reporting

```
You are a senior engineer building the community incident reporting 
system for "SafeHer".

This system allows women to anonymously flag unsafe areas so others 
can avoid them. Quality and moderation are critical — false reports 
can cause panic.

Build complete reporting system:

1. Mobile — /app/(tabs)/community.tsx:

   CommunityMapScreen:
   - Map centered on user's current location
   - Incident heatmap overlay (density-based coloring)
   - Individual incident markers with type icons:
     * 🔴 Red: Assault, serious incident
     * 🟠 Orange: Harassment, following
     * 🟡 Yellow: Poor lighting, suspicious activity
     * ⚫ Black: Unsafe area (general)
   - Filter by incident type, time (last 24h/7d/30d)
   - "Report Incident" floating button (red, prominent)
   - Tap marker → see incident summary (no details to prevent panic)
   - My Reports tab (user's own reports)
   - Heat map vs pin view toggle

2. /components/community/ReportIncidentModal.tsx:
   
   4-step reporting flow:
   
   Step 1 — Location:
   - Current location auto-selected on map
   - User can drag pin to exact location
   - Address shown below map
   - Accuracy indicator
   
   Step 2 — Incident Type:
   - Large icon grid, single selection:
     [Harassment] [Poor Lighting] [Suspicious Activity]
     [Unsafe Area] [Assault] [Being Followed] [Other]
   - Each icon has clear label and color
   
   Step 3 — Details (all optional):
   - Description: 500 char max textarea ("What happened?")
   - Photo upload: camera or gallery (optional — evidence)
   - Time: "Just now" (default) or time picker
   - Anonymous toggle: ON by default (important for safety)
   - If anonymous: "Your identity will NOT be shared"
   
   Step 4 — Confirm & Submit:
   - Location map preview
   - Type + description summary
   - Anonymous status confirmation
   - Submit button
   - Success: "Report submitted. Thank you for keeping the community safe."

3. Backend — /src/routes/reports.js:
   
   POST /api/reports:
   - Validate incident type, lat/lng required
   - If anonymous: store report without user_id link
   - Store report with expires_at (7 days minor, 30 days serious)
   - Trigger danger zone recalculation for the area
   - If report is within 100m of existing danger zone: increment count
   - Else: flag for potential new danger zone creation (requires 3+ reports)
   - Return: report_id, confirmation

   GET /api/reports/map:
   - Accept: bounds (sw_lat, sw_lng, ne_lat, ne_lng)
   - Return: all non-expired incidents in viewport
   - Cluster nearby incidents (prevent marker clutter)
   - Include: type, count, last_reported_at (no descriptions for privacy)

   GET /api/reports/heatmap:
   - Return aggregated density data for heatmap rendering

   POST /api/reports/:id/upvote:
   - User upvotes to confirm report accuracy
   - One upvote per user per report
   - If upvotes > 5: increase danger_level of zone

   POST /api/reports/:id/dismiss:
   - User flags report as inaccurate
   - If dismiss > upvote: flag for moderation review

4. Moderation System:
   
   /src/services/moderationService.js:
   - Auto-flag reports with:
     * Photo content (AI moderation via Google Vision or AWS Rekognition)
     * Duplicate reports in same location < 10 minutes
     * User reported > 5 incidents in 24 hours (spam prevention)
   
   /src/routes/admin.js (admin-only):
   - GET /api/admin/reports/pending — review flagged reports
   - PUT /api/admin/reports/:id/verify — mark as verified
   - DELETE /api/admin/reports/:id — remove false reports
   - Simple admin web dashboard for moderation

5. Danger Zone Aggregation:
   
   /src/services/dangerZoneService.js:
   - Run every 6 hours via cron job
   - Cluster incidents within 300m radius using DBSCAN algorithm
   - If cluster has 3+ incidents: create danger_zone record
   - If cluster has 7+ incidents: escalate to 'high' danger level
   - Remove zones with no recent incidents (30-day cleanup)
   - Notify users who have saved routes through updated zones

6. Community Trust Features:
   - Show "X people reported this area" (not individual reports)
   - Verified reporter badge (users who have had reports confirmed)
   - Report accuracy score (internal — rewards accurate reporters)
   - "This area has been reported safe by 15 people" (positive reports)

7. Safe area reporting (positive):
   - Users can also mark an area as SAFE
   - "I walk here regularly and it's fine"
   - Balances fear-mongering with reality

Output:
- Community map screen with full filtering
- Report incident modal (4 steps)
- All backend routes
- Moderation service
- Danger zone aggregation service
- Admin dashboard (basic)
- /docs/community-moderation.md explaining the trust system
```

---

## 🔴 FEATURE 7: Check-In System

### Prompt 7.1 — Journey Check-In & Monitoring

```
You are a senior mobile engineer building the check-in and 
journey monitoring system for "SafeHer".

Purpose: User sets a destination and expected arrival time.
If they don't check in, emergency contacts are automatically alerted.

Build complete check-in system:

1. Mobile — /app/(tabs)/check-in.tsx:

   CheckInSetupScreen:
   - "Where are you going?" — destination input with map picker
   - "When should you arrive?" — time picker
   - Grace period: "Alert if I'm [15/30/45] minutes late"
   - Who to notify: show emergency contacts, toggle each
   - "Share Journey" toggle: contacts can see your live location during journey
   - "Start Check-In" button

   ActiveCheckInScreen:
   - Status: "Check-in active — [destination] by [time]"
   - Large "I've Arrived Safely!" button (green, prominent)
   - Countdown: "Check-in required in 23 minutes"
   - Live map (optional — shows current position to contacts)
   - "Extend Time" button (+15 min, +30 min, cancel check-in)
   - Warning: turns red in last 5 minutes before alert triggers

2. Backend — /src/routes/checkIns.js:
   
   POST /api/check-ins:
   - Create check-in record
   - Schedule notification job (via bull/agenda.js) for expected_arrival_at
   - Job fires if status is still 'pending' at alert time
   - Return: check_in_id, tracking_url (if share journey enabled)

   PUT /api/check-ins/:id/arrived:
   - Mark as 'checked_in'
   - Cancel scheduled alert job
   - Send "safe arrival" notification to contacts who were notified

   PUT /api/check-ins/:id/extend:
   - Accept: additional_minutes
   - Reschedule alert job
   - Notify contacts of extension: "[Name] has extended her check-in by 30 minutes"

   POST /api/check-ins/:id/trigger-alert:
   - Called by scheduler when check-in is missed
   - Send SMS + push notification to selected contacts:
     "[Name] was supposed to arrive at [Destination] by [Time].
      She has not checked in. Please check on her.
      Last known location: https://safeher.app/track/[token]"
   - Escalate to SOS if no contact responds in 30 minutes

3. /services/checkInService.ts (mobile):
   - Monitor active check-in state
   - Send reminders at: 30 min before, 10 min before, 5 min before
   - Auto-prompt location permission for journey sharing
   - Handle app being closed during active check-in (background task)
   - Push notification: "Don't forget to check in! You have 10 minutes."

4. Recurring Check-In Templates:
   - "Daily commute home" — set a recurring check-in
   - Active on selected days (e.g., Mon-Fri)
   - Time: 7:30 PM (office to home)
   - Destination: Home
   - If enabled: auto-creates check-in at set time without manual setup
   
5. Journey History:
   - Past check-ins with: destination, status, duration
   - Map replay of journey (if location was shared)
   - "Safe journeys: 47" — positive reinforcement

6. Smart Check-In Suggestions:
   - If user opens app at night (8PM-11PM): show "Start a check-in?"
   - If user is at an unusual location at unusual time: suggest check-in
   - Based on calendar integration (if permitted): detect when user has late meetings

Output:
- Complete check-in screens
- Scheduling service (bull.js + Redis)
- Auto-alert on missed check-in
- Recurring check-ins
- Journey history
- /docs/check-in-system.md with alert escalation flow
```

---

## 🔴 FEATURE 8: Safety Dashboard & Home Screen

### Prompt 8.1 — Home Screen & Quick Access

```
You are a senior UX/mobile engineer building the home screen and 
safety dashboard for "SafeHer".

The home screen must allow SOS activation within 2 taps from anywhere.
It must feel safe and reassuring — not alarming.

Build complete home screen:

1. /app/(tabs)/index.tsx — Home Screen:
   
   Layout (top to bottom):
   
   Header:
   - "Good [morning/evening], [Name]" — time-aware greeting
   - Small avatar (top right)
   - Safety status pill: "🟢 Safe" / "🟡 Journey Active" / "🔴 SOS Active"
   
   SOS Button (center, always prominent):
   - Large circular button (red gradient)
   - Text: "HOLD FOR SOS"
   - Animated pulse ring (subtle, not alarming)
   - Below: "Press 5x power button anytime"
   
   Quick Actions row:
   [🤙 Fake Call] [📍 Check-In] [🗺️ Safe Route] [👥 Share Location]
   
   Active Status Cards (if any active):
   - Active SOS card (red) — if SOS is active
   - Active Check-In card (green) — countdown to check-in time
   - Journey In Progress card (blue) — route + ETA
   
   Safety Snapshot:
   - Current area safety: "Your area has [N] reports this week"
   - Nearest safe place: "Police Station — 0.3km"
   - Nearest emergency: "Tap to call 112"
   
   Quick Emergency Contacts:
   - 3 emergency contacts with call buttons
   - "Add more contacts" if < 3
   
   Community Alert Banner (if nearby incidents):
   - "⚠️ 3 incidents reported near you today"
   - Tap to see map

2. /components/shared/QuickSOSFAB.tsx:
   - Floating action button visible on ALL screens
   - Position: bottom-right
   - Red circle, phone + SOS icon
   - Press and hold → SOS countdown begins (same as main SOS button)
   - This ensures SOS is always accessible

3. /components/home/SafetySnapshotCard.tsx:
   - Current location safety score (from danger zones)
   - "Your area: SAFE / CAUTION / DANGER"
   - Shows based on incidents in 500m radius
   - Nearest safe place with walking distance
   - Updates every 5 minutes

4. /components/home/EmergencyContacts Quick Access:
   - Shows first 3 emergency contacts
   - One-tap call button for each
   - "Message" option (opens pre-filled "I need help" message)

5. Settings Screen — /app/settings.tsx:
   - Profile settings
   - Emergency contacts management (add/edit/remove)
   - SOS trigger preferences (power button, shake, voice)
   - Notification preferences
   - Privacy settings:
     * Who can see my location during SOS
     * Auto-delete location history after N days
   - Home/Work address (encrypted)
   - Language selection (English, Hindi, Tamil, Telugu, Marathi)
   - App lock: PIN / biometric required to open app
   - "Disguise app" option: Change app icon/name to "Calculator" 
     (for users in controlling relationships — safety feature)
   - Export my data (GDPR)
   - Delete account

6. Panic Mode / Disguised App:
   - User can set a "disguise" — app appears as Calculator
   - Secret gesture or code to enter real SafeHer mode
   - Press 5+7+= on calculator to switch to safety mode
   - This is critical for users in abusive relationships

Output:
- Complete home screen with all components
- Settings screen
- QuickSOSFAB present on all tab screens
- Disguised app feature
- Safety snapshot card with live data
- /docs/home-screen-ux.md explaining design decisions
```

---

## 🔴 FEATURE 9: Additional Safety Features (Power Features)

### Prompt 9.1 — Audio/Video Evidence Recording

```
You are a senior mobile engineer building the evidence recording 
system for "SafeHer".

During an emergency, users may need to collect evidence. 
This must be covert — no visible recording indicator if possible.

Build complete evidence system:

1. /services/evidenceService.ts:
   
   startAudioRecording(alertId):
   - Record audio via expo-av
   - Save to device secure storage
   - Upload to backend in 30-second chunks (in case device is taken)
   - Encrypt each chunk before upload (AES-256)
   - Auto-stop after SOS resolved or battery < 10%
   
   startPhotoCapture(alertId):
   - Take front camera photo every 30 seconds
   - Store locally + upload immediately
   - No camera shutter sound (mute before capture)
   - No screen flash
   - Continue in background
   
   stopAllRecording():
   - Stop all recording streams
   - Ensure all data is uploaded
   - Generate evidence report

2. Backend — /src/routes/evidence.js:
   
   POST /api/evidence/audio/:alertId:
   - Accept encrypted audio chunk
   - Store in secure S3-compatible storage
   - Decrypt and store server-side
   - Return: chunk_id, total_chunks
   
   POST /api/evidence/photo/:alertId:
   - Accept image (compressed, max 2MB)
   - Store securely
   - Return: photo_id

   GET /api/evidence/:alertId (user or designated contact only):
   - Return presigned URLs for all evidence
   - Log every access in audit_logs
   - Evidence accessible for 90 days then auto-deleted

3. Evidence Security:
   - All evidence encrypted at rest (AES-256)
   - Access only to: the user, and contacts explicitly designated as "trusted for evidence"
   - Admins cannot access evidence without court order (by policy)
   - Evidence can be emailed to user's email on SOS resolve
   - "Share with police" button: generate time-limited download link

4. Legal Admissibility Notes:
   - Timestamp each piece of evidence with GPS location
   - Store hash of each file (for integrity verification)
   - Chain of custody log
   - Note: laws on recording vary by country — show disclaimer

Output:
- Complete evidence service
- Backend storage routes
- Evidence viewer screen
- Security and encryption implementation
- Legal disclaimer modal
```

---

### Prompt 9.2 — Guardian Mode & Trusted Circle

```
You are a senior engineer building the Guardian Mode feature 
for "SafeHer".

Guardian Mode allows a trusted person (guardian) to passively 
monitor a user's safety without being intrusive.

Build Guardian Mode:

1. Guardian relationship system:
   
   Types of guardians:
   - Parent monitoring college-going child
   - Partner mutual safety sharing
   - Friend group safety circle (group of friends monitoring each other)
   
   Setup:
   - User designates a contact as "Guardian"
   - Guardian receives invite link
   - Guardian creates SafeHer account (or uses guest mode)
   - Guardian can see:
     * User's real-time location (only when user shares)
     * Active SOS alerts
     * Journey status
     * Last seen time

2. /app/guardian/ screens:
   
   GuardianDashboard:
   - Shows all people you're guarding (your "circle")
   - Each person: name, last seen, current status, location
   - Color coding: green (safe) / yellow (journey active) / red (SOS)
   - "Check on her" button — sends a gentle push: "[Guardian] is checking on you. Are you safe?"
   - User can respond: "Yes, I'm safe" / "Help me" / "I'll call you"

3. Battery sharing & health monitoring:
   - If guarded person's battery drops below 20%: notify guardian
   - If app is unresponsive for 4+ hours at night: notify guardian

4. Safe zone alerts:
   - Guardian can set "safe zones" (home, work, college)
   - Get notified when person LEAVES a safe zone after 10PM
   - Get notified when person ARRIVES at safe zone (peace of mind)

5. Privacy controls (critical):
   - User can pause guardian monitoring at any time with one tap
   - Guardian can only see location when user explicitly shares
   - User can revoke guardian access instantly
   - Mutual opt-in required for all sharing

Output:
- Guardian dashboard
- Circle management
- Safe zone configuration
- Privacy controls
- /docs/guardian-mode.md explaining the privacy model
```

---

### Prompt 9.3 — AI Threat Detection & Proactive Safety

```
You are a senior engineer building AI-powered threat detection 
for "SafeHer".

Build proactive safety features that detect potential danger 
before the user has to trigger SOS manually.

Build threat detection system:

1. /services/threatDetectionService.ts:
   
   analyzePatterns() — runs every 5 minutes in background:
   - Check: Has user been at an unusual location for >1 hour at night?
   - Check: Is user's speed unexpectedly 0 (stopped) in a danger zone?
   - Check: Is user traveling in the wrong direction from their destination?
   - Check: Did user's phone screen go dark for 30+ minutes at night in unfamiliar area?
   - Check: Is accelerometer showing unusual patterns (fall detection)?
   
   Fall detection:
   - Sudden high-g acceleration followed by stillness → potential fall
   - Trigger gentle notification: "Are you okay? Tap if you're safe"
   - No response in 60 seconds → send alert to emergency contacts

2. Contextual safety tips:
   - If user opens route planner at 11PM: "Night safety mode active. Safest routes prioritized."
   - If user is near a flagged area: "Heads up: this area has recent incident reports."
   - "You're 5 minutes from your check-in destination. Should we auto-check-in?"

3. Predictive danger alerting:
   - If user's route passes through a high-danger zone: warn before journey
   - "Your route passes through an area with 8 recent reports. 
      We recommend an alternate route."

4. Smart SOS suggestions:
   - If accelerometer detects running + elevated heart rate (if watch connected): 
     prompt: "Looks like you might be running. Are you safe?"
   - (Heart rate requires Apple Watch / WearOS integration — future feature)

5. Daily safety check:
   - 9PM daily notification: "Planning to travel tonight? Start a check-in."
   - Only if user has traveled late before (personalized)
   - Opt-out in settings

Output:
- Threat detection service with all pattern checks
- Fall detection
- Contextual notification system
- /docs/ai-safety-detection.md
```

---

## 🔴 FEATURE 10: Backend Infrastructure & Admin

### Prompt 10.1 — Complete Backend API & Security

```
You are a senior backend engineer finalizing the backend infrastructure 
for "SafeHer".

Build production-ready backend with all security hardening:

1. Express app setup (src/index.js):
   - Helmet.js for security headers
   - CORS: whitelist only mobile app origins
   - Rate limiting: express-rate-limit
   - Request logging: morgan + winston
   - Body size limit: 10MB (for photo uploads)
   - HTTPS only in production
   - Gzip compression

2. Authentication middleware:
   - Verify Supabase JWT on all protected routes
   - Extract user_id from token
   - Check user is_active before each request
   - Role-based access: admin routes protected separately

3. Rate limiting by endpoint:
   - /api/auth/send-otp: 3/hour per IP + phone
   - /api/sos/trigger: 10/hour per user (prevent spam)
   - /api/reports: 10/hour per user
   - /api/routes/suggest: 60/hour per user
   - Global: 200 requests/minute per user

4. Phone number validation:
   - Use libphonenumber-js
   - Validate + normalize all phone inputs
   - Store in E.164 format

5. Data encryption:
   - Encrypt sensitive fields at application level: home_address, work_address
   - Use AES-256-GCM with unique IV per record
   - Keys stored in environment variables / secret manager

6. Audit logging (every sensitive action logged):
   - User login
   - SOS trigger
   - Emergency contact access
   - Evidence access
   - Admin actions

7. Error handling:
   - Global error handler (never expose stack traces in production)
   - All errors logged to Sentry
   - User-facing errors are generic ("Something went wrong")

8. Geospatial queries (PostGIS):
   - All proximity queries use PostGIS: ST_DWithin, ST_Distance
   - Incidents within radius: ST_DWithin(location, point, radius_meters)
   - Route safety: ST_Intersects(route_line, danger_zone_polygon)
   - Proper GIST indexes on all geometry columns

9. Background jobs (Bull + Redis):
   - SOS alert delivery retries
   - Check-in expiry monitoring
   - Daily danger zone recalculation
   - Evidence file cleanup (90 days)
   - User activity cleanup

10. Health check endpoints:
    GET /health — basic
    GET /health/detailed — DB, Redis, Twilio, FCM status

Output:
- Complete backend setup with all middleware
- Security hardening checklist
- All geospatial query helpers
- Background job setup
- Dockerfile + docker-compose for production
- /docs/backend-security.md
- Deployment guide (Railway, Fly.io, or AWS)
```

---

## 🔴 FEATURE 11: Testing, Deployment & Launch

### Prompt 11.1 — Testing Strategy

```
You are a senior QA engineer writing a complete testing strategy 
for "SafeHer" — a safety-critical application.

In safety apps, failures can have life-or-death consequences.
Testing must be exhaustive.

Build complete test suite:

1. Critical Path Tests (MUST all pass before any release):

   SOS System Tests:
   - SOS triggers within 3 seconds of button hold
   - SMS delivered to all contacts within 30 seconds
   - Location sharing starts within 10 seconds of SOS
   - SOS works when internet is unavailable (queued and sent on reconnect)
   - SOS works when app is completely closed (background task)
   - SOS cannot be triggered accidentally (requires hold)
   - SOS can be cancelled within countdown window
   - "I'm Safe" requires confirmation (no accidental cancellation)
   - Location tracking continues for 6+ hours (battery drain test)

   Notification Tests:
   - SMS delivered via Twilio in < 30 seconds
   - Push notification delivered in < 10 seconds
   - Notifications received when app is killed (iOS + Android)
   - Critical notifications bypass Do Not Disturb

   Location Tests:
   - Background location accurate to < 20 meters
   - Location updates survive 2-hour continuous tracking
   - Web tracking page updates in real-time (< 5 second delay)
   - Tracking works in airplane mode (shows cached last location)

2. Security Tests:
   - OTP is single-use (cannot be reused)
   - OTP expires after 10 minutes
   - JWT cannot be used after logout
   - User A cannot access User B's SOS data
   - Evidence files not accessible without authentication
   - Anonymous reports cannot be traced to user
   - SQL injection tests on all inputs
   - Location data cleared after SOS resolved + 7 days

3. Load Tests:
   - 1000 concurrent SOS alerts (Twilio + DB load)
   - 10,000 location updates per minute
   - 5000 concurrent tracking page views

4. UX Tests (simulated real scenarios):
   Scenario A: Woman walking alone at night
   - Triggers SOS via power button (5x press)
   - Should: alert contacts in < 60 seconds, start tracking
   
   Scenario B: User's battery dies during SOS
   - Should: last known location preserved, contacts notified of signal loss
   
   Scenario C: SOS triggered accidentally
   - Should: easily cancelable within countdown, send "false alarm" to contacts
   
   Scenario D: No internet for 20 minutes during SOS
   - Should: queue all data, sync when connection returns

5. Device compatibility tests:
   - Android 8+ (API 26+)
   - iOS 14+
   - Low-end devices (2GB RAM)
   - Background restrictions on Xiaomi, Huawei, OnePlus (known problematic)

Output:
- Complete test file for SOS system (Jest + Detox for E2E)
- Twilio mock for SMS tests
- Critical path test checklist (run before each release)
- Device compatibility matrix
- /docs/testing-guide.md
```

---

## 🔴 FEATURE 12: Security Hardening & Rate Limiting

### Prompt 12.1 — Backend Rate Limiting & Mobile Resilience

```
ROLE:
You are a senior backend security engineer fixing rate limiting 
issues in a vibe-coded Android app backend.

PROJECT CONTEXT:
- Mobile app: React Native (Android)
- Backend: Node.js + Express
- Database: Supabase (PostgreSQL)
- Cache: Redis (Upstash)
- The backend was quickly vibe-coded and has NO rate limiting
  currently implemented anywhere

PROBLEM:
The app has these critical unprotected endpoints that can be abused:
1. POST /api/auth/send-otp     → spammable, costs money per SMS
2. POST /api/sos/trigger       → can flood contacts with fake alerts
3. POST /api/reports           → can spam the community map
4. POST /api/routes/suggest    → costs money per Google Maps call
5. All other endpoints         → no protection at all

WHAT I WANT YOU TO BUILD:

Step 1 — Install dependencies:
npm install express-rate-limit rate-limit-redis ioredis

Step 2 — Create /backend/src/middleware/rateLimiter.js
Build a centralized rate limiter file with these separate limiters:
- otpLimiter: 5 reqs/hr (phone/IP)
- sosLimiter: 10 reqs/hr (user)
- reportLimiter: 3 reqs/10min, 10 reqs/hr
- routeLimiter: 60/hour (user)
- globalLimiter: 200/min (auth), 30/min (unauth)
- authLimiter: 10 failures/15min

Step 3 — Redis Integration
- Use Redis with In-Memory failover if Redis is down.

Step 4 — Apply to Backend Routes
- Apply globally and to specific endpoints (auth, sos, reports, routes).

Step 5 — Mobile-Side Handling
- Catch 429 status codes in services/apiService.ts.
- Implement Exponential Backoff retry (1s, 2s, 4s).
- SOS Fallback: If 429 hit during SOS, prompt Native SMS fallback immediately.

Step 6 — Security Test Suite
- Verify OTP, SOS, and Global limits with Supertest.
```---

## 🔒 FEATURE 13: Authentication Security Hardening

### Prompt 13.1 — Secure OTP & JWT Rotation

```
ROLE:
You are a senior security engineer auditing and rebuilding 
authentication for a vibe-coded Android safety app backend.

PROJECT CONTEXT:
- Mobile app: React Native (Android) — SafeHer women's safety app
- Backend: Node.js + Express
- Auth method: Phone number + OTP (no email/password)
- Database: Supabase (PostgreSQL)
- Token storage on device: expo-secure-store (NOT AsyncStorage)

WHAT WAS BUILT:
1. Secure OTP Generation (crypto.randomInt)
2. JWT Rotation (Access + Refresh Tokens)
3. Replay Attack Detection with Token Families
4. Brute-force protection with account lockout
5. Mobile hardware-backed SecureStore integration
6. Biometric Re-auth support
7. App integrity (Root/Jailbreak) detection
```

---

# PART 2: MASTER REFERENCE DOCUMENT

---

# 🛡️ SafeHer — Master Project Reference Document

> **For AI Editors:** This is the single source of truth for SafeHer. Read entirely before writing any code. Safety-critical app — failures have real-world consequences. Never implement shortcuts on SOS, location, or notification systems.

---

## 📋 Table of Contents

1. Project Overview & Mission
2. Core Features (Required)
3. Power Features (Differentiators)
4. User Personas
5. Complete User Flows
6. Tech Stack — Full Specification
7. System Architecture
8. Folder Structure
9. Database Schema
10. API Endpoints — Complete Contract
11. Notification System Spec
12. Safety Scoring Algorithm
13. Security Rules (Non-Negotiable)
14. Environment Variables
15. Gamification & Engagement
16. Gap Analysis — What Was Missing & Could Kill This App
17. Non-Negotiable Rules for AI Editor

---

## 1. Project Overview & Mission

**Product Name:** SafeHer  
**Category:** Women's Personal Safety  
**Platform:** Mobile (React Native / Expo) — iOS + Android  
**Target Market:** Women in India (initially), globally scalable  
**Problem:** Personal safety during late-night commutes, unfamiliar areas, and unsafe situations  

**Core Value:** One-touch emergency system that immediately gets help to you when seconds matter.

**What makes SafeHer different:**
- Works offline (critical in India where connectivity varies)
- Multilingual (Hindi, English, Tamil, Telugu, Marathi)
- Disguised app mode for users in dangerous home situations
- Community-powered real-time safety data
- Not just SOS — proactive safety (routes, check-ins, guardian mode)

---

## 2. Core Features (Required — From Problem Statement)

| # | Feature | Priority | Status |
|---|---|---|---|
| 1 | SOS Button with live GPS sharing | P0 (Critical) | ✅ IMPLEMENTED |
| 2 | Emergency contact SMS notification | P0 (Critical) | ✅ IMPLEMENTED |
| 3 | Live location tracking for contacts | P0 (Critical) | ✅ IMPLEMENTED |
| 4 | Fake Call Simulator | P1 (High) | ✅ IMPLEMENTED |
| 5 | Safe Route Suggester (time-aware) | P1 (High) | ✅ IMPLEMENTED |
| 6 | Community Incident Reporting (anonymous) | P1 (High) | ✅ IMPLEMENTED |
| 12 | Security Hardening & Rate Limiting | P0 (Critical) | ✅ IMPLEMENTED |
| 13 | Authentication Security Hardening | P0 (Critical) | ✅ IMPLEMENTED |
| 14 | Database Audit & Optimization | P0 (Critical) | ✅ IMPLEMENTED |
| 15 | Premium UI Redesign (Dark Theme) | P1 (High) | ✅ IMPLEMENTED |

---

## 3. Power Features (Differentiators — What Makes This Impactful)

| # | Feature | Why It Matters | Status |
|---|---|---|---|
| 7 | Journey Check-In System | Most deaths happen when no one knows you're traveling | ✅ IMPLEMENTED |
| 8 | Multiple SOS Triggers | Power button, shake, voice — for when button unreachable | ✅ IMPLEMENTED |
| 9 | Offline SOS Queue | Connectivity issues in India — SOS can't fail | ✅ IMPLEMENTED |
| 10 | Disguised App Mode | Critical for users in controlling/abusive relationships | ✅ IMPLEMENTED |
| 11 | Evidence Recording | Audio + photo capture during emergency | ✅ IMPLEMENTED |
| 12 | Guardian Mode | Passive monitoring with privacy controls | ✅ IMPLEMENTED |
| 13 | Fall Detection | Automatic SOS when user falls unconscious | ✅ IMPLEMENTED |
| 14 | Safe Places Map | Shows verified police stations, hospitals nearby | ✅ IMPLEMENTED |
| 15 | Web Tracking Page | Contacts don't need the app to track you | ✅ IMPLEMENTED |
| 16 | Multilingual | Hindi/Tamil/Telugu — critical for India | Must ship |
| 17 | Low-End Device Support | ₹5000 phones have 2GB RAM — must work | Must ship |
| 18 | Battery-Aware Operations | Reduce data usage when battery is low | Must ship |
| 19 | Contact Verification | Confirm contacts are real before emergency | Must ship |
| 20 | Smart Night Mode | Heightened safety features after 9PM | Must ship |

---

## 4. User Personas

### Persona 1: College Student (Priya, 20)
- Travels home from college late at night
- Parents worry but she wants independence
- Uses: Check-in, route suggester, quick SOS
- Concern: False alarms embarrassing her

### Persona 2: Working Professional (Meera, 28)
- Late office hours, travels by metro/auto
- Lives alone in new city
- Uses: Journey monitoring, fake call, community map
- Concern: Too many notifications (alert fatigue)

### Persona 3: Domestic Violence Survivor (Ananya, 35)
- In a controlling relationship
- Cannot have "safety app" visible on phone
- Uses: Disguised app, hidden SOS, trusted guardian
- Concern: Partner finding the app

### Persona 4: Guardian Parent (Rajesh, 52)
- Daughter uses SafeHer
- Wants peace of mind
- Uses: Guardian mode, receives SOS alerts
- Concern: Complex technology

---

## 5. Complete User Flows

### 5.1 First Launch Flow
```
Download App
  → Phone number entry + OTP verification
  → Onboarding Step 1: Permissions (Location, Contacts, Notifications)
  → Onboarding Step 2: Add emergency contacts (min 1)
  → Onboarding Step 3: Set home/work address
  → Onboarding Step 4: SOS trigger preferences
  → Onboarding Step 5: Fake call setup
  → Completion: "You're protected"
  → Home screen
```

### 5.2 SOS Trigger Flow (Happy Path)
```
Emergency happens
  → User holds SOS button OR presses power button 5x OR shakes phone
  → Countdown modal (3-10 sec): "SOS in 3...2...1"
  → [User can cancel]
  → SOS fires:
      → Location tracking starts (every 10 sec)
      → SMS to all emergency contacts
      → Push notifications to contacts with app
      → Tracking link generated
      → Screen turns red (active SOS mode)
  → Contacts receive SMS with live tracking link
  → Contacts open tracking link in browser
  → Contacts see real-time location on map
  → User resolves by pressing "I'm Safe" (double confirmation)
  → Contacts receive "She's safe" notification
  → Location tracking stops
  → Alert saved in history
```

### 5.3 SOS Offline Flow
```
Emergency happens + No internet
  → SOS triggered locally
  → Device SMS API used directly (no Twilio — device sends SMS)
  → Location stored in local queue
  → When internet returns:
      → Backend notified of SOS
      → Twilio sends formatted SMS
      → Location data synced
      → Tracking link activated
```

### 5.4 Fake Call Flow
```
User feels unsafe in situation
  → Home screen: tap "Fake Call"
  → Select delay: Now / 30s / 1 min / Custom
  → Select caller: Mom / Boss / Custom
  → Confirm
  → After delay: Phone rings exactly like real call
  → User answers fake call
  → Active call screen (looks real)
  → Fake conversation audio plays (optional)
  → After 60-120 seconds: call ends naturally
  → User is now "off the phone" and can leave situation
```

### 5.5 Safe Route Flow
```
User planning travel
  → Tap "Safe Route" on home screen
  → Enter destination (or select from history/saved)
  → App fetches 3 route alternatives from Google Maps
  → Each route scored for safety:
      → Community reports along route
      → Danger zones on path
      → Safe places (police, hospitals) nearby
      → Time-of-day multiplier
  → Routes shown: [Safest] [Balanced] [Fastest]
  → User selects route
  → Optionally: "Start Journey" for deviation monitoring
  → Navigation view (or handoff to Google Maps)
  → Journey complete: mark arrival
```

### 5.6 Check-In Flow
```
User about to travel alone
  → Tap "Check-In" on home screen
  → Set destination + expected arrival time
  → Select contacts to notify if missed
  → "Start Check-In"
  → User travels
  → Reminder at 10 min before deadline
  → User arrives → taps "I've Arrived Safely"
  → Contacts notified: "Priya arrived safely at [Destination]"
  
  [If not checked in:]
  → Deadline passes
  → SMS to contacts: "Priya has not checked in. She was due at [place] by [time]."
  → 30 min later, still no response: escalates to SOS
```

### 5.7 Community Report Flow
```
User experiences/witnesses unsafe situation
  → Tap "Report" from community map
  → Map shows current location (draggable)
  → Select incident type
  → Add optional description (500 char)
  → Add optional photo
  → Anonymous toggle: ON (default)
  → Submit
  → Community map updates with new report
  → Nearby users with active sessions see updated map
  → If 3+ reports in same area: danger zone created
```

---

## 6. Tech Stack — Full Specification

### Mobile App
| Tech | Version | Purpose |
|---|---|---|
| React Native | Latest | Cross-platform mobile |
| Expo SDK | 51 | Development framework |
| Expo Router | v3 | File-based navigation |
| TypeScript | 5.x | Type safety |
| Zustand | 4.x | State management |
| React Query | v5 | Server state + caching |
| expo-location | Latest | GPS tracking |
| expo-task-manager | Latest | Background tasks |
| expo-notifications | Latest | Push notifications |
| expo-av | Latest | Audio recording + playback |
| expo-camera | Latest | Photo capture |
| expo-contacts | Latest | Contact access |
| expo-local-authentication | Latest | Biometric auth |
| expo-secure-store | Latest | Secure token storage |
| expo-device | Latest | Device info + jailbreak detection |
| react-native-maps | Latest | Map display |
| Mapbox Maps | Latest | Alternative to Google Maps |
| react-native-reanimated | 3.x | Animations |
| NativeWind | 4.x | Tailwind for React Native |

### Backend
| Tech | Version | Purpose |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| Express.js | 4.x | Web framework |
| PostgreSQL | 15 | Primary database |
| PostGIS | 3.x | Geospatial queries |
| Supabase | Cloud | DB hosting + Realtime + Auth |
| Prisma | 5.x | ORM |
| Redis | 7.x | OTP storage, rate limiting, job queues |
| Bull | 4.x | Background job queues |
| Twilio | Latest | SMS + Voice |
| Firebase Admin | Latest | Push notifications |
| AWS S3 / Supabase Storage | — | Evidence file storage |
| Google Maps Platform | — | Directions API, Geocoding |
| Sentry | Latest | Error monitoring |
| Winston | Latest | Structured logging |
| Helmet.js | Latest | Security headers |

### DevOps
| Tech | Purpose |
|---|---|
| Docker | Containerization |
| Railway / Fly.io | Backend hosting |
| GitHub Actions | CI/CD |
| Cloudflare | CDN + DDoS protection |
| UptimeRobot | Uptime monitoring (critical for safety app) |

---

## 7. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  MOBILE APP (Expo)                  │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐  │
│  │ SOS Btn │ │FakeCall  │ │Routes  │ │Community │  │
│  └────┬────┘ └────┬─────┘ └───┬────┘ └────┬─────┘  │
└───────┼───────────┼───────────┼────────────┼─────────┘
        │           │           │            │
        └───────────┴─────┬─────┴────────────┘
                          │ HTTPS + JWT
                ┌─────────▼──────────┐
                │   Express Backend   │
                │   (Railway/Fly.io) │
                └──┬──────┬──────┬───┘
                   │      │      │
         ┌─────────▼┐  ┌──▼──┐ ┌▼──────────┐
         │Supabase  │  │Redis│ │Twilio/FCM  │
         │(DB+Auth+ │  │     │ │(SMS+Push)  │
         │Realtime) │  └─────┘ └───────────┘
         └──────────┘
                │
        ┌───────▼────────┐
        │ Web Tracking    │
        │ Page (Public)  │
        │ /track/:token  │
        └────────────────┘
```

---

## 8. API Endpoints — Complete Contract

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/send-otp | None | Send OTP to phone |
| POST | /api/auth/verify-otp | None | Verify OTP, issue JWT |
| POST | /api/auth/refresh | Refresh token | Get new access token |
| POST | /api/auth/logout | JWT | Invalidate session |

### SOS
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/sos/trigger | JWT | Trigger SOS alert |
| POST | /api/sos/:id/location | JWT | Update location during SOS |
| PUT | /api/sos/:id/resolve | JWT | Mark SOS resolved |
| GET | /api/sos/history | JWT | Past SOS alerts |
| GET | /track/:token | None (public) | Web tracking page |

### Emergency Contacts
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/contacts | JWT | Get all contacts |
| POST | /api/contacts | JWT | Add contact |
| PUT | /api/contacts/:id | JWT | Update contact |
| DELETE | /api/contacts/:id | JWT | Remove contact |
| POST | /api/contacts/verify | JWT | Verify contact's number |

### Routes
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/routes/suggest | JWT | Get safe route suggestions |
| POST | /api/routes/journey/start | JWT | Start journey monitoring |
| PUT | /api/routes/journey/:id/end | JWT | End journey |
| GET | /api/routes/saved | JWT | Get saved routes |

### Check-Ins
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/check-ins | JWT | Create check-in |
| PUT | /api/check-ins/:id/arrived | JWT | Mark arrived |
| PUT | /api/check-ins/:id/extend | JWT | Extend time |
| DELETE | /api/check-ins/:id | JWT | Cancel check-in |
| GET | /api/check-ins/history | JWT | Past check-ins |

### Community Reports
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /api/reports/map | JWT | Get reports in viewport |
| GET | /api/reports/heatmap | JWT | Heatmap density data |
| POST | /api/reports | JWT | Submit incident report |
| POST | /api/reports/:id/upvote | JWT | Upvote a report |
| GET | /api/danger-zones | JWT | Get active danger zones |
| GET | /api/safe-places | JWT | Get safe places near location |

### Fake Call
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/fake-call/schedule | JWT | Log scheduled fake call |
| GET | /api/fake-call/configs | JWT | Get saved caller configs |
| POST | /api/fake-call/configs | JWT | Save caller config |

### Evidence
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/evidence/audio/:alertId | JWT | Upload audio chunk |
| POST | /api/evidence/photo/:alertId | JWT | Upload photo |
| GET | /api/evidence/:alertId | JWT | Get all evidence |

### Webhooks (No Auth — Signature Verified)
| Method | Endpoint | Description |
|---|---|---|
| POST | /webhook/twilio/sms-status | Delivery receipts |
| POST | /webhook/twilio/incoming-sms | Handle SAFE/HELP replies |
| POST | /webhook/fcm/delivery | Push delivery status |

---

## 9. Notification Message Templates

### SOS Alert SMS
```
🚨 EMERGENCY ALERT
[Name] needs help urgently!

📍 Live location: https://safeher.app/track/[TOKEN]
⏰ Alert at: [TIME] [DATE]
📞 Her number: [PHONE]

• Reply SAFE when she's confirmed safe
• Reply HELP to share your location with her

This is an automated alert from SafeHer Safety App.
```

### Check-In Missed SMS
```
⚠️ MISSED CHECK-IN
[Name] hasn't checked in!

She was supposed to reach [DESTINATION] by [TIME].
It's now [CURRENT_TIME] and we haven't heard from her.

📍 Last known location: https://safeher.app/track/[TOKEN]
📞 Her number: [PHONE]

Please try to reach her immediately.
— SafeHer Safety App
```

### Safe Arrival SMS
```
✅ She's safe!
[Name] has confirmed she is safe.

Alert has been resolved.
Thank you for being there for her.
— SafeHer Safety App
```

### Contact Verification SMS
```
Hi [CONTACT_NAME],
[USER_NAME] has added you as an emergency contact on SafeHer safety app.

If something happens to her, you'll receive alerts and her live location.

You don't need to do anything right now.
Learn more: https://safeher.app/guardian-info
— SafeHer Safety App
```

---

## 10. Safety Scoring Algorithm

### Route Safety Score Formula
```
Base Score: 100

Deductions:
- Each incident report within 500m of route: -10 (max -50)
- Each active danger zone the route passes through: -20
- Route passes through isolated area (no POIs): -15
- Route has no police/safe places within 1km: -10

Additions:
- Police station within 500m of any part of route: +15
- Hospital/fire station within 500m: +10
- Main road (vs alley): +10
- Well-lit (if data available): +5

Time Multipliers (applied to deduction severity only):
- 6AM–8PM: 1.0x (deductions normal)
- 8PM–10PM: 1.3x (deductions 30% worse)
- 10PM–6AM: 1.6x (deductions 60% worse — night mode)

Final: Clamp score between 0–100

Labels:
- 80–100: Safe (green)
- 60–79: Caution (yellow)
- 40–59: Be Careful (orange)
- 0–39: Avoid (red)
```

---

## 11. Security Rules (Non-Negotiable)

1. **JWT in SecureStore ONLY** — never AsyncStorage (encrypted hardware storage)
2. **Phone OTP is cryptographically random** — never Math.random()
3. **OTP is single-use** — deleted from Redis immediately after verification
4. **All location data is user-owned** — no third-party access, ever
5. **Anonymous reports are truly anonymous** — no user_id stored if anonymous
6. **Evidence is encrypted** — AES-256 at rest and in transit
7. **Certificate pinning** — prevent MITM on API calls
8. **Jailbreak/root detection** — warn user about security risk
9. **No location data after SOS + 7 days** — auto-delete policy
10. **Disguised app mode is never stored in plaintext** — the disguise is the security
11. **Admin cannot access evidence without audit log** — chain of custody
12. **Rate limiting on all endpoints** — SOS alert spam prevention
13. **SOS trigger requires intentional action** — minimum 3-second hold or 5 power presses
14. **Two-step confirmation to cancel SOS** — cannot accidentally dismiss
15. **Background location requires explicit user consent** — always re-ask on reinstall

---

## 12. Environment Variables

### Mobile (.env)
```env
EXPO_PUBLIC_API_BASE_URL=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_TRACKING_BASE_URL=https://safeher.app/track
```

### Backend (.env)
```env
# Database
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
JWT_SECRET=
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=30d

# Communications
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WHATSAPP_FROM=

# Push Notifications
FCM_SERVER_KEY=
APNS_KEY_ID=
APNS_TEAM_ID=
APNS_KEY_FILE_PATH=

# Maps
GOOGLE_MAPS_API_KEY=

# Storage
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=

# Cache + Queues
REDIS_URL=

# Monitoring
SENTRY_DSN=

# Encryption
ENCRYPTION_KEY=  # 256-bit hex key for field encryption

# Webhooks
TWILIO_WEBHOOK_AUTH_TOKEN=

# App
APP_ENV=development
TRACKING_BASE_URL=https://safeher.app/track
APP_BUNDLE_ID=com.safeher.app
```

---

## 13. Gap Analysis — What Was Missing & Could Kill This App

### 🔴 Critical Gaps (App Fails Without These)

**Gap 1: OEM Background Kill Issue**
- Xiaomi, Huawei, OnePlus, Samsung aggressively kill background apps in India
- Without addressing this: SOS will NOT fire when app is backgrounded on 60%+ of Indian phones
- **Fix:** Add OEM-specific battery optimization exempt instructions in onboarding
  Include links to dontkillmyapp.com settings for each OEM
  Use android:persistent="true" carefully and foreground service for SOS

**Gap 2: SMS Fallback When Twilio Fails**
- Twilio outages happen. During a real emergency with no SMS, someone could die.
- **Fix:** Integrate second SMS provider (AWS SNS, MSG91, or TextLocal as backup)
  Also: Use device's native SMS API as last resort (no formatting, just raw location)

**Gap 3: Low Connectivity Areas**
- 30%+ of India has 2G or weak 3G in their primary location
- GPS alone works without internet — but Twilio/internet required for tracking link
- **Fix:** SMS with static Google Maps link: 
  "Location at alert time: maps.google.com/?q=28.6139,77.2090"
  (works even with no live tracking)
  Store location snapshots locally and upload in batches

**Gap 4: No Contact Response if Contacts Are Sleeping**
- SOS at 2AM — contacts are asleep, phone on silent
- **Fix:** iOS Critical Alerts (bypasses silent mode) — requires special Apple entitlement
  Android: Send SMS + Call (Twilio can initiate automated voice call saying "Emergency alert from SafeHer")
  Consider: Robocall to contact's number reading out the emergency

**Gap 5: False Alarm Fatigue**
- If contacts get too many false alarms: they'll ignore real ones
- **Fix:** False alarm tracking — if user has 3+ false alarms: suggest increasing countdown timer
  "Did you mean to trigger SOS?" post-false-alarm survey
  Show contacts their response history

**Gap 6: What Happens When User's Phone Is Taken**
- If attacker takes the phone and cancels the SOS
- **Fix:** Require PIN to cancel SOS (different from unlock PIN)
  Contacts can override — if contact sends "NOCANCL" SMS → SOS stays active
  Dead man's switch: if SOS cancelled but location goes dark within 10 minutes → re-alert

### 🟠 High Impact Gaps

**Gap 7: No Audio Evidence Without App Open**
- Audio recording stops if phone is locked on iOS
- **Fix:** Use background audio mode (expo-av with background audio category)
  Test explicitly: recording with screen locked for 30 minutes

**Gap 8: No Police Integration**
- App sends SMS to mom, not police
- **Fix:** Partner with state police for direct integration (Himmat+ model from Delhi Police)
  One-tap report to local police WhatsApp number (many districts have this)
  Deep link to Dial 112 with pre-filled location

**Gap 9: No Menstrual/Medical Context**
- Women may have specific needs (panic attacks, health conditions)
- **Fix:** Optional medical info section (blood type, allergies, conditions)
  Shareable with emergency contacts
  Medical ICE (In Case of Emergency) screen on lock screen

**Gap 10: Language Barrier in SOS SMS**
- SMS sent in English but recipient (grandmother, village contact) reads only Hindi
- **Fix:** Each contact has language preference
  SMS sent in contact's preferred language
  Multi-language OTP and all system messages

**Gap 11: No Backup Plan for Dead Battery**
- Battery dies during SOS
- **Fix:** SOS contacts sent 10-minute warning when battery < 15% AND SOS active
  Last GPS snapshot taken and sent to contacts before shutdown
  Contacts notified: "[Name]'s phone battery has died. Last known location: [coords]"

**Gap 12: Check-In Has No Escalation Path**
- Missed check-in sends SMS, but what if contacts also don't respond?
- **Fix:** Escalation chain: 
  T+0: Send SMS to primary contact
  T+15min: Send SMS to all contacts
  T+30min: Send SMS with option to escalate to police
  T+60min: Offer to contact local police helpline automatically

**Gap 13: Route Suggester Has No Real Traffic Data**
- Foot traffic = safety. Empty streets = danger. Google Maps doesn't expose crowd density.
- **Fix:** Use Google Popular Times API (unofficial) for crowd density
  Community data: "X SafeHer users active on this route in last hour"
  Time-of-day historical incident data (our own database)

**Gap 14: Community Reports Have No Quality Control**
- Anyone can post anything → misinformation → panic in safe areas
- **Fix:** Weighted trust score system (accurate reporters get more weight)
  Reports from verified accounts get priority
  AI image moderation on photos
  Auto-expire unverified reports after 24 hours

**Gap 15: No Offline Map Cache**
- Route suggestions need internet
- **Fix:** Pre-cache maps for home→work route
  Store last safety score for known routes
  Offline fallback: show cached route with "data may be 24h old" warning

**Gap 16: No Data Portability / Account Deletion**
- GDPR (and India DPDP Act 2023) require data deletion on request
- **Fix:** "Delete my account" removes all PII within 30 days
  Location history auto-deleted after 30 days
  Export my data (JSON download of all user data)
  Privacy policy explicitly covering DPDP Act compliance

**Gap 17: Onboarding Completion Rate Will Be Low**
- 5-step onboarding is too long → users will drop off
- **Fix:** Minimum viable onboarding: phone + 1 contact (2 steps max)
  Rest is optional and set up via nudges post-onboarding
  "You can skip this — add later" on every optional step

**Gap 18: No In-App Emergency Helplines**
- Many women don't know emergency numbers
- **Fix:** Built-in helpline directory:
  National: 112, 100 (Police), 181 (Women)
  State-wise numbers (configurable by user's state)
  NGO helplines: iCall, Vandrevala Foundation (mental health)
  These should work even with no internet (just phone calls)

**Gap 19: Accessibility for Disabilities**
- Visually impaired users also need safety apps
- **Fix:** Full VoiceOver/TalkBack support
  Voice-activated SOS ("Hey SafeHer, help me")
  Large text support
  High contrast mode

**Gap 20: Teen/Minor-Specific Features**
- Many users will be 13-17 year olds
- **Fix:** Parent approval for under-18 accounts
  Default guardian enabled for minors
  More sensitive location sharing (parents see more)
  School-safe content filtering

---

## 14. Non-Negotiable Rules for AI Editor

### SOS System Rules
1. SOS trigger MUST work within 2 taps from any screen
2. SOS MUST work when app is completely closed (background task)
3. SMS MUST be sent using device SMS API as backup when Twilio fails
4. SOS countdown MUST be cancelable only within the countdown window
5. Location tracking MUST continue for minimum 6 hours during active SOS
6. NEVER queue the initial SOS trigger — it must be immediate and parallel

### Data & Privacy Rules
7. Location data NEVER shared with third parties
8. Anonymous reports NEVER store user_id
9. Evidence ALWAYS encrypted before upload
10. JWT NEVER stored in AsyncStorage — SecureStore ONLY
11. OTP NEVER logged in any log file
12. User data deleted within 30 days of deletion request

### Performance Rules
13. SOS button press-to-SMS time: TARGET < 30 seconds
14. App MUST function on 2G network (optimize all API calls)
15. Home screen MUST load in < 2 seconds on low-end device
16. Location accuracy: < 20 meters horizontal accuracy required

### UX Rules
17. SOS button MUST be visible without scrolling on home screen
18. Every action in emergency mode needs confirmation (no accidental cancellation)
19. Emergency contact call buttons MUST be reachable with one hand
20. App MUST work in Hindi — English is secondary for target market

### Testing Rules
21. SOS flow MUST be manually tested on physical device before every release
22. Test on: Xiaomi Redmi (most common in India), Samsung budget, iOS
23. Battery drain test: app running 8 hours must not drain > 15% per hour
24. No release if SOS SMS delivery rate < 99% in staging environment

---

*Document Version: 1.0*  
*Last Updated: Project Init*  
*Classification: Internal — AI Editor Reference*
