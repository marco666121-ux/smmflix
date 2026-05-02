ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS contact_label TEXT NOT NULL DEFAULT 'Contact',
ADD COLUMN IF NOT EXISTS contact_button_color TEXT NOT NULL DEFAULT 'emerald',
ADD COLUMN IF NOT EXISTS contact_links JSONB NOT NULL DEFAULT '[{"name":"WhatsApp Chat","url":"https://wa.me/918848490476"}]'::jsonb;