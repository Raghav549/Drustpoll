CREATE INDEX IF NOT EXISTS users_username_lower_idx ON users (lower(username));
CREATE INDEX IF NOT EXISTS profiles_display_name_lower_idx ON profiles (lower(display_name));
CREATE INDEX IF NOT EXISTS posts_caption_lower_idx ON posts (lower(caption)) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS products_title_lower_idx ON products (lower(title)) WHERE status='active';
