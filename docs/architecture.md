# SafeHer System Architecture

## Overview
SafeHer is a comprehensive women's safety platform consisting of a React Native (Expo) mobile application and a Node.js/Express backend. It leverages Supabase (PostgreSQL) for primary data storage and real-time features, and Twilio for SMS communications.

## Components
1. **Mobile App**: Built with Expo and React Native, utilizing file-based routing via `expo-router`. Crucial capabilities include offline resilience, background task management for live location sharing, and push notifications.
2. **Backend API**: A Node.js and Express application deployed (or containerized) to handle complex orchestration tasks such as requesting Twilio SMS messages, JWT verification, and managing Redis for OTP processing.
3. **Database**: Managed by Supabase (PostgreSQL), with PostGIS extensions enabled for optimal spatial queries.
4. **Realtime Services**: Supabase Realtime WebSocket subscriptions handle the live location broadcast to emergency tracking web pages.
5. **Caching**: Redis is used for fast and transient interactions, specifically for single-use OTP validation within the authentication flow.

## Notification Failover Chain
1. Primary: Twilio SMS.
2. Secondary: Push Notifications (`expo-notifications` + Firebase Cloud Messaging).
3. Tertiary: Twilio WhatsApp integration.
