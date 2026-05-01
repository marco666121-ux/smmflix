// All admin-configurable settings now live in the database via useSiteSettings.
// This file only exports things that are still purely client-side.

export { applyMarkup, findRedeemPercent, resolveTiers, FEATURED_MAX, DEFAULT_FORMATTER_TIERS } from "@/hooks/useSiteSettings";
export type { RedeemCode, TierMode, SiteSettings } from "@/hooks/useSiteSettings";

export const ADMIN_PASSWORD = "2689";
