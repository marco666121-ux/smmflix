ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS minimal_mode boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS ui_visibility jsonb NOT NULL DEFAULT '{}'::jsonb;