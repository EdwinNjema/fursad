
-- Reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id_hash TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  description TEXT NOT NULL,
  voice_url TEXT,
  area_name TEXT,
  when_bucket TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO anon, authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can insert reports" ON public.reports FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anyone can read verified reports" ON public.reports FOR SELECT TO anon, authenticated USING (verified = true);

-- Mentorship requests (phone encrypted at app layer)
CREATE TABLE public.mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id_hash TEXT,
  need TEXT NOT NULL,
  contact_method TEXT NOT NULL,
  phone_encrypted TEXT,
  consent BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days')
);
GRANT INSERT ON public.mentorship_requests TO anon, authenticated;
GRANT ALL ON public.mentorship_requests TO service_role;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can insert mentorship requests" ON public.mentorship_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Opportunities
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  opp_date DATE,
  location TEXT,
  description TEXT NOT NULL,
  apply_instructions TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.opportunities TO anon, authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read opportunities" ON public.opportunities FOR SELECT TO anon, authenticated USING (true);

-- Forum posts
CREATE TABLE public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  voice_url TEXT,
  upvotes INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.forum_posts TO anon, authenticated;
GRANT ALL ON public.forum_posts TO service_role;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads non-hidden posts" ON public.forum_posts FOR SELECT TO anon, authenticated USING (hidden = false);
CREATE POLICY "anyone inserts posts" ON public.forum_posts FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Forum replies
CREATE TABLE public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  content TEXT NOT NULL,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.forum_replies TO anon, authenticated;
GRANT ALL ON public.forum_replies TO service_role;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads non-hidden replies" ON public.forum_replies FOR SELECT TO anon, authenticated USING (hidden = false);
CREATE POLICY "anyone inserts replies" ON public.forum_replies FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Blocked keywords (for moderation)
CREATE TABLE public.blocked_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blocked_keywords TO anon, authenticated;
GRANT ALL ON public.blocked_keywords TO service_role;
ALTER TABLE public.blocked_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads blocked keywords" ON public.blocked_keywords FOR SELECT TO anon, authenticated USING (true);

-- RPC: upvote a post (so anon can increment without UPDATE grant)
CREATE OR REPLACE FUNCTION public.upvote_post(post_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_count INTEGER;
BEGIN
  UPDATE public.forum_posts SET upvotes = upvotes + 1 WHERE id = post_id AND hidden = false RETURNING upvotes INTO new_count;
  RETURN new_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.upvote_post(UUID) TO anon, authenticated;

-- Seed sample opportunities
INSERT INTO public.opportunities (title, type, opp_date, location, description, apply_instructions, featured) VALUES
('ICT Skills Training', 'Workshop', CURRENT_DATE + 14, 'Garissa', 'Free 4-week ICT skills training for youth aged 18-30. Covers basic computing, internet, and digital literacy.', 'Visit Garissa Youth Centre with your ID between 9am-4pm to register.', true),
('Tailoring Apprenticeship', 'NGO', CURRENT_DATE + 7, 'Wajir Town', 'Six-month tailoring apprenticeship with stipend. Tools provided.', 'Call FURSAD team via the Mentors tab to express interest.', false),
('County Youth Bursary', 'County', CURRENT_DATE + 30, 'Wajir County', 'Bursary applications open for secondary and tertiary education.', 'Pick up application forms at your sub-county office.', true);
