-- Enable Row Level Security on all core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users Policy: Can only read/update their own record
CREATE POLICY users_own_record ON users
  FOR ALL USING (id::text = current_setting('app.current_user_id', true));

-- Emergency contacts: User sees only their own
CREATE POLICY contacts_own ON emergency_contacts
  FOR ALL USING (user_id::text = current_setting('app.current_user_id', true));

-- SOS Alerts: User sees only their own
CREATE POLICY sos_own ON sos_alerts
  FOR ALL USING (user_id::text = current_setting('app.current_user_id', true));

-- Location Tracking: User sees only their own SOS tracking data
CREATE POLICY location_own ON location_tracking
  FOR ALL USING (user_id::text = current_setting('app.current_user_id', true));

-- Check-Ins: User sees only their own check-ins
CREATE POLICY check_ins_own ON check_ins
  FOR ALL USING (user_id::text = current_setting('app.current_user_id', true));

-- Refresh Tokens: User sees only their own tokens
CREATE POLICY refresh_tokens_own ON refresh_tokens
  FOR ALL USING (user_id::text = current_setting('app.current_user_id', true));

-- Community Reports: Anyone can READ, only owner can UPDATE/DELETE
CREATE POLICY reports_read ON community_reports
  FOR SELECT USING (true);

CREATE POLICY reports_write ON community_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY reports_own_modify ON community_reports
  FOR ALL USING (
    reported_by_user_id::text = current_setting('app.current_user_id', true)
    OR (reported_by_user_id IS NULL AND is_anonymous = true)
  );

-- Audit Logs: User sees only their own logs
CREATE POLICY audit_logs_own ON audit_logs
  FOR ALL USING (user_id::text = current_setting('app.current_user_id', true));
