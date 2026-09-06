-- Platform foundation hardening.
-- These indexes are intentionally deferred until their base columns/tables exist.
-- The ALTER TABLE statements are idempotent, so existing databases can safely
-- replay this migration after partial deployment.

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS grouped_key text;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='notifications') THEN
    CREATE INDEX IF NOT EXISTS notifications_recipient_idx
      ON notifications(recipient_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS notifications_unread_idx
      ON notifications(recipient_id, created_at DESC)
      WHERE read_at IS NULL;
    CREATE INDEX IF NOT EXISTS notifications_grouped_idx
      ON notifications(recipient_id, grouped_key, created_at DESC)
      WHERE read_at IS NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='messages') THEN
    CREATE INDEX IF NOT EXISTS messages_sender_idx
      ON messages(sender_id, created_at DESC)
      WHERE deleted_at IS NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='post_reactions') THEN
    CREATE INDEX IF NOT EXISTS post_reactions_user_idx
      ON post_reactions(user_id, created_at DESC);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='post_saves') THEN
    CREATE INDEX IF NOT EXISTS post_saves_user_idx
      ON post_saves(user_id, created_at DESC);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='comments') THEN
    CREATE INDEX IF NOT EXISTS comments_author_idx
      ON comments(author_id, created_at DESC)
      WHERE deleted_at IS NULL;
  END IF;
END $$;
