-- refresh_tokens table for Feature 13 Auth Hardening
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    token_family UUID NOT NULL,
    device_id TEXT,
    is_revoked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by hash
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON public.refresh_tokens(token_hash);

-- Index for grouping by family (to revoke whole families)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON public.refresh_tokens(token_family);

-- RLS Policies
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role should manage these tokens directly
CREATE POLICY "Service role can manage all tokens" 
ON public.refresh_tokens 
FOR ALL 
TO service_role 
USING (true);
