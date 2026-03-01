# SafeHer Database Schema & Documentation

## Overview
This document contains the complete PostgreSQL schema, including tables, indexes, PostGIS setup, and Row-Level Security (RLS) policies for the SafeHer application, built on top of Supabase.

## Extensions
```sql
-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;
-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

## Tables

### 1. users
```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    profile_photo_url TEXT,
    home_address TEXT, -- encrypted preferably at app level
    work_address TEXT, -- encrypted preferably at app level
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: Users can only read/update their own profile
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own profile" ON public.users
    FOR ALL USING (auth.uid() = id);
```

### 2. emergency_contacts
```sql
CREATE TABLE public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    relationship VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    notify_on_sos BOOLEAN DEFAULT TRUE,
    notify_on_route_deviation BOOLEAN DEFAULT TRUE,
    notify_on_check_in_missed BOOLEAN DEFAULT TRUE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);

-- RLS
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their contacts" ON public.emergency_contacts
    FOR ALL USING (auth.uid() = user_id);
```

### 3. sos_alerts
```sql
CREATE TABLE public.sos_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) CHECK (trigger_type IN ('button', 'shake', 'voice', 'auto_detect')),
    status VARCHAR(50) CHECK (status IN ('active', 'resolved', 'false_alarm', 'cancelled')) DEFAULT 'active',
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    initial_latitude DOUBLE PRECISION,
    initial_longitude DOUBLE PRECISION,
    resolution_notes TEXT,
    contacts_notified JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX idx_sos_alerts_user_id ON public.sos_alerts(user_id);
CREATE INDEX idx_sos_alerts_status ON public.sos_alerts(status);

-- RLS: Users handle their own alerts
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own alerts" ON public.sos_alerts
    FOR ALL USING (auth.uid() = user_id);
```

### 4. location_tracking
```sql
CREATE TABLE public.location_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sos_alert_id UUID REFERENCES public.sos_alerts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (recorded_at);

-- Example Partition
CREATE TABLE public.location_tracking_y2026m02 PARTITION OF public.location_tracking
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE INDEX idx_location_tracking_sos ON public.location_tracking(sos_alert_id);
CREATE INDEX idx_location_tracking_geom ON public.location_tracking USING GIST (ST_MakePoint(longitude, latitude));

-- RLS
ALTER TABLE public.location_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own path" ON public.location_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public read for active tracking tokens" ON public.location_tracking FOR SELECT USING (true);
```

### 5. safe_routes
```sql
CREATE TABLE public.safe_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    origin_name VARCHAR(255),
    destination_name VARCHAR(255),
    origin_lat DOUBLE PRECISION,
    origin_lng DOUBLE PRECISION,
    destination_lat DOUBLE PRECISION,
    destination_lng DOUBLE PRECISION,
    route_polyline TEXT NOT NULL,
    safety_score INTEGER CHECK (safety_score >= 0 AND safety_score <= 100),
    is_saved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_safe_routes_user ON public.safe_routes(user_id);

-- RLS
ALTER TABLE public.safe_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own routes" ON public.safe_routes FOR ALL USING (auth.uid() = user_id);
```

### 6. community_reports
```sql
CREATE TABLE public.community_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    incident_type VARCHAR(50) CHECK (incident_type IN ('harassment', 'poor_lighting', 'suspicious_activity', 'unsafe_area', 'assault', 'following', 'other')),
    description VARCHAR(500),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location_accuracy_meters DOUBLE PRECISION,
    photo_url TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    upvote_count INTEGER DEFAULT 0,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_reports_geom ON public.community_reports USING GIST (ST_MakePoint(longitude, latitude));
CREATE INDEX idx_reports_expires ON public.community_reports(expires_at);

-- RLS
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active reports" ON public.community_reports FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Users can create reports" ON public.community_reports FOR INSERT WITH CHECK (true);
```

### 7. report_upvotes
```sql
CREATE TABLE public.report_upvotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.community_reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    upvoted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(report_id, user_id)
);
```

### 8. fake_calls
```sql
CREATE TABLE public.fake_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    delay_seconds INTEGER CHECK (delay_seconds IN (0, 10, 30, 60, 120)),
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    triggered_at TIMESTAMP WITH TIME ZONE
);
-- RLS
ALTER TABLE public.fake_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manage own fake calls" ON public.fake_calls FOR ALL USING (auth.uid() = user_id);
```

### 9. check_ins
```sql
CREATE TABLE public.check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    destination_name VARCHAR(255) NOT NULL,
    expected_arrival_at TIMESTAMP WITH TIME ZONE NOT NULL,
    check_in_window_minutes INTEGER DEFAULT 15,
    status VARCHAR(50) CHECK (status IN ('pending', 'checked_in', 'missed', 'sos_triggered')) DEFAULT 'pending',
    contacts_to_notify JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_check_ins_status ON public.check_ins(status);
```

### 10. danger_zones
```sql
CREATE TABLE public.danger_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_latitude DOUBLE PRECISION NOT NULL,
    center_longitude DOUBLE PRECISION NOT NULL,
    radius_meters DOUBLE PRECISION NOT NULL,
    danger_level VARCHAR(50) CHECK (danger_level IN ('low', 'medium', 'high', 'critical')),
    incident_count INTEGER DEFAULT 0,
    last_incident_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_danger_zones_geom ON public.danger_zones USING GIST (ST_MakePoint(center_longitude, center_latitude));
```

### 11. safe_places
```sql
CREATE TABLE public.safe_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    place_type VARCHAR(50) CHECK (place_type IN ('police_station', 'hospital', 'fire_station', 'safe_haven_shop', 'women_helpdesk')),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    phone_number VARCHAR(20),
    is_24_hours BOOLEAN DEFAULT FALSE,
    verified_by_admin BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_safe_places_geom ON public.safe_places USING GIST (ST_MakePoint(longitude, latitude));
```

### 12. audit_logs
```sql
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Triggers

### 1. Auto-create contacts/streak on signup
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a default audit log
  INSERT INTO public.audit_logs (user_id, action) VALUES (NEW.id, 'user_registered');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Seed Data

### Safe Places (Example: Mumbai)
```sql
INSERT INTO public.safe_places (name, place_type, latitude, longitude, phone_number, is_24_hours, verified_by_admin) VALUES
('Colaba Police Station', 'police_station', 18.9192, 72.8286, '100', TRUE, TRUE),
('Lilavati Hospital', 'hospital', 19.0505, 72.8252, '022-26402441', TRUE, TRUE);
```

### Incident Types (Community Reports)
```sql
INSERT INTO public.community_reports (reported_by_user_id, incident_type, description, latitude, longitude, expires_at) VALUES
(NULL, 'poor_lighting', 'Street lights not working', 19.0760, 72.8777, NOW() + INTERVAL '7 days'),
(NULL, 'harassment', 'Catcalling group corner', 19.0500, 72.8250, NOW() + INTERVAL '30 days');
```
