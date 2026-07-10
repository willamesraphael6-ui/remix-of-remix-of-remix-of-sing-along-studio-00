
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS points bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_sing_date date,
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'neon';

CREATE OR REPLACE FUNCTION public.bump_profile_after_performance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_br date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  prev_date date;
  prev_streak int;
  new_streak int;
  streak_bonus int;
  gained bigint;
BEGIN
  SELECT last_sing_date, current_streak INTO prev_date, prev_streak
    FROM public.profiles WHERE id = NEW.user_id;

  IF prev_date IS NULL THEN
    new_streak := 1;
  ELSIF prev_date = today_br THEN
    new_streak := GREATEST(COALESCE(prev_streak, 1), 1);
  ELSIF prev_date = today_br - INTERVAL '1 day' THEN
    new_streak := COALESCE(prev_streak, 0) + 1;
  ELSE
    new_streak := 1;
  END IF;

  streak_bonus := LEAST(new_streak, 30) * 2;
  gained := 10 + NEW.score + streak_bonus;

  UPDATE public.profiles SET
    total_score = total_score + NEW.score,
    performances_count = performances_count + 1,
    best_score = GREATEST(best_score, NEW.score),
    points = points + gained,
    current_streak = new_streak,
    longest_streak = GREATEST(longest_streak, new_streak),
    last_sing_date = today_br,
    updated_at = now()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_profile_after_performance ON public.performances;
CREATE TRIGGER trg_bump_profile_after_performance
  AFTER INSERT ON public.performances
  FOR EACH ROW EXECUTE FUNCTION public.bump_profile_after_performance();

-- Backfill points/streak retroativos para usuários existentes com performances
UPDATE public.profiles p
SET points = COALESCE(sub.pts, 0)
FROM (
  SELECT user_id, SUM(10 + score)::bigint AS pts
  FROM public.performances
  GROUP BY user_id
) sub
WHERE p.id = sub.user_id AND p.points = 0;
