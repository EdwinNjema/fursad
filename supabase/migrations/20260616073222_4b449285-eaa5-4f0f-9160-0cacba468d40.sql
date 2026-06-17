
-- Move blocked_keywords moderation server-side: stop exposing the wordlist
DROP POLICY IF EXISTS "anyone reads blocked keywords" ON public.blocked_keywords;
REVOKE SELECT ON public.blocked_keywords FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_content_blocked(_text text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_keywords
    WHERE position(lower(keyword) in lower(_text)) > 0
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_content_blocked(text) TO anon, authenticated;

-- Allow reading media bucket files so uploaded incident photos/videos can be displayed
CREATE POLICY "anyone can read media"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'media');
