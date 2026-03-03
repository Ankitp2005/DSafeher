-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users
-- Reason: OTP verification looks up by phone constantly
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

-- Emergency Contacts
-- Reason: Every SOS trigger fetches contacts by user_id
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON emergency_contacts(user_id);

-- SOS Alerts
-- Reason: SOS history and active alert lookups must be instant
CREATE INDEX IF NOT EXISTS idx_sos_user_id ON sos_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_status ON sos_alerts(status) WHERE status = 'ACTIVE';

-- Location Tracking (HIGH VOLUME TABLE)
-- Reason: Tracking page fetches latest location points by alert_id
CREATE INDEX IF NOT EXISTS idx_location_alert_id ON location_tracking(sos_alert_id);
CREATE INDEX IF NOT EXISTS idx_location_recorded_at ON location_tracking(recorded_at);

-- Community Reports (GEOSPATIAL)
-- Reason: Bounding box/radius queries on map viewport hit this constantly
CREATE INDEX IF NOT EXISTS idx_reports_location ON community_reports 
  USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography);

-- Reason: Filtering out expired reports from the map
CREATE INDEX IF NOT EXISTS idx_reports_expires ON community_reports(expires_at) 
  WHERE expires_at > NOW();

-- Danger Zones (GEOSPATIAL)
-- Reason: Route safety scoring checks if path intersects these zones
CREATE INDEX IF NOT EXISTS idx_danger_zones_location ON danger_zones
  USING GIST (ST_SetSRID(ST_MakePoint(center_longitude, center_latitude), 4326)::geography);

-- Reason: Active zones only for scoring
CREATE INDEX IF NOT EXISTS idx_danger_zones_active ON danger_zones(is_active) WHERE is_active = true;

-- Refresh Tokens
-- Reason: Token rotation and session validation on every authenticated request
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- Audit Logs
-- Reason: Searching logs by user or date range for security audits
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);
