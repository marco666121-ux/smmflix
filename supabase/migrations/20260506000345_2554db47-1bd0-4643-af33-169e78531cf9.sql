ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS ui_text jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ui_theme jsonb NOT NULL DEFAULT '{}'::jsonb;