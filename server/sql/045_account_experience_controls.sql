CREATE TABLE IF NOT EXISTS account_experience_preferences(
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  appearance text NOT NULL DEFAULT 'system' CHECK(appearance IN ('system','light','dark')),
  language text NOT NULL DEFAULT 'en',
  region text NOT NULL DEFAULT 'IN',
  currency char(3) NOT NULL DEFAULT 'INR',
  reduced_motion boolean NOT NULL DEFAULT false,
  data_saver boolean NOT NULL DEFAULT false,
  large_text boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
