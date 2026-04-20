-- Enable postgis extension for geospatial indexing if needed (optional since we'll use Geohash algorithm in python)
-- create extension if not exists postgis;

-- 1. Users Table (Extends Supabase Auth users)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender TEXT,
    email TEXT,
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: We assume the user logs in via Supabase Email OTP. Upon signup, a trigger or a client insert can populate this.
-- However, for simplicity, we allow inserts from the client.

-- Set RLS for User Profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own profile." ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles are viewable by everyone." ON public.user_profiles FOR SELECT USING (true);


-- 2. Pools Table
CREATE TABLE public.pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.user_profiles(id) NOT NULL,
    source_lat NUMERIC NOT NULL,
    source_lng NUMERIC NOT NULL,
    source_geohash TEXT NOT NULL,
    source_text TEXT,
    dest_lat NUMERIC NOT NULL,
    dest_lng NUMERIC NOT NULL,
    dest_text TEXT,
    time_window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    capacity INT NOT NULL,
    available_seats INT NOT NULL,
    mode_of_transport TEXT NOT NULL,
    status TEXT DEFAULT 'open', -- 'open', 'full', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Pools
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pools are viewable by everyone." ON public.pools FOR SELECT USING (true);
CREATE POLICY "Users can insert their own pools." ON public.pools FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update their own pools." ON public.pools FOR UPDATE USING (auth.uid() = creator_id);


-- 3. Pool Requests Table
CREATE TABLE public.pool_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID REFERENCES public.pools(id) ON DELETE CASCADE,
    requester_id UUID REFERENCES public.user_profiles(id) NOT NULL,
    requester_source_lat NUMERIC NOT NULL,
    requester_source_lng NUMERIC NOT NULL,
    requester_dest_lat NUMERIC NOT NULL,
    requester_dest_lng NUMERIC NOT NULL,
    requester_time TIMESTAMP WITH TIME ZONE NOT NULL,
    heuristic_score NUMERIC,
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Pool Requests
ALTER TABLE public.pool_requests ENABLE ROW LEVEL SECURITY;
-- Requesters can see their own requests. Pool creators can see requests for their pools.
CREATE POLICY "Users can see their own requests." ON public.pool_requests FOR SELECT USING (auth.uid() = requester_id);
CREATE POLICY "Pool creators can see requests to their pools." ON public.pool_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.pools p WHERE p.id = pool_id AND p.creator_id = auth.uid())
);
CREATE POLICY "Users can insert requests." ON public.pool_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Pool creators can update request status." ON public.pool_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.pools p WHERE p.id = pool_id AND p.creator_id = auth.uid())
);


-- 4. Ratings Table
CREATE TABLE public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rater_id UUID REFERENCES public.user_profiles(id),
    ratee_id UUID REFERENCES public.user_profiles(id),
    pool_id UUID REFERENCES public.pools(id),
    score INT CHECK (score >= 1 AND score <= 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see ratings." ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert ratings." ON public.ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- Turn on realtime for pools and pool_requests
ALTER PUBLICATION supabase_realtime ADD TABLE pools, pool_requests;

-- 5. Pool Messages (Group Chat)
CREATE TABLE public.pool_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID REFERENCES public.pools(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.user_profiles(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pool_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see messages of pools they are part of." ON public.pool_messages FOR SELECT USING (true); -- in production, check membership
CREATE POLICY "Users can insert messages." ON public.pool_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

ALTER PUBLICATION supabase_realtime ADD TABLE pool_messages;

-- 6. Performance Indices (Run these to speed up large tables)
CREATE INDEX IF NOT EXISTS idx_pools_source_geohash ON public.pools (source_geohash);
CREATE INDEX IF NOT EXISTS idx_pools_creator_id ON public.pools (creator_id);
CREATE INDEX IF NOT EXISTS idx_pools_status ON public.pools (status);
CREATE INDEX IF NOT EXISTS idx_pool_requests_pool_id ON public.pool_requests (pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_requests_requester_id ON public.pool_requests (requester_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee_id ON public.ratings (ratee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_id ON public.ratings (rater_id);
CREATE INDEX IF NOT EXISTS idx_pool_messages_pool_id ON public.pool_messages (pool_id);
