-- One-time auth reset requested for a clean end-to-end signup verification pass.
-- Deleting users cascades through auth/profile/social/commerce user-owned records
-- where the schema explicitly uses ON DELETE CASCADE; protected order/review
-- relationships are intentionally left intact by the database constraints.
DELETE FROM users;