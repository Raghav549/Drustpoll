import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pool } from './db.js';

const files=[
  '001_auth.sql','002_social_commerce.sql','003_platform_foundation.sql','004_discovery_search.sql','005_payment_core.sql','006_safety_controls.sql','007_media_pipeline.sql','008_recommendation_events.sql','009_reels_watch_sessions.sql','010_ranking_experiments.sql','011_multimodal_features.sql','012_feature_workers.sql','013_rank_training_features.sql','014_e2ee_checkout_security.sql','015_commerce_events.sql','016_media_job_leases.sql','017_feed_events_durable.sql','018_privacy_accessibility.sql','019_security_audit.sql','020_commerce_category.sql','021_discovery_retrieval.sql','022_design_observability.sql','023_social_surface_completion.sql','024_discovery_reels_completion.sql','025_profile_surface_completion.sql','026_creator_messaging_completion.sql','027_notification_market_completion.sql','028_market_indexes.sql','029_notification_backfill.sql','030_market_variants_storefront.sql','031_commerce_advanced.sql','032_commerce_operational.sql','033_commerce_safety_invariants.sql','034_commerce_aggregates.sql','035_commerce_fallbacks.sql','036_commerce_seed_safety.sql','037_commerce_payment_runtime.sql','038_commerce_order_receipts.sql','039_checkout_state.sql','040_checkout_addresses_and_delivery.sql','041_checkout_methods.sql','042_checkout_coupons.sql','043_checkout_payment_attempts.sql','044_settings_safety_privacy_completion.sql','045_account_experience_controls.sql','046_safety_reporting_completion.sql','047_safety_uniqueness.sql','048_settings_safety_completion.sql','049_settings_safety_runtime.sql','050_safety_runtime_indexes.sql','051_seller_commerce_controls.sql','052_seller_ads_runtime.sql','053_settings_safety_advertising_runtime.sql','054_final_runtime_hardening.sql','055_variant_cart_order_runtime.sql','056_variant_constraints.sql','057_settings_safety_finalization.sql','058_settings_safety_data.sql','059_auth_email_delivery.sql','060_auth_indexes.sql','061_existing_schema_compat.sql','062_schema_compatibility_hardening.sql','063_auth_device_integrity.sql','064_auth_session_family.sql','065_auth_session_rotation.sql'
];

async function ensureCompatibility(client: any){
  await client.query(`DO $$ BEGIN
    IF to_regclass('public.profiles') IS NOT NULL THEN
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name text NOT NULL DEFAULT '';
    END IF;
  END $$;`);
  await client.query(`DO $$ BEGIN
    IF to_regclass('public.content_features') IS NOT NULL THEN
      ALTER TABLE content_features ADD COLUMN IF NOT EXISTS id uuid;
      ALTER TABLE content_features ADD COLUMN IF NOT EXISTS asset_id uuid;
      ALTER TABLE content_features ADD COLUMN IF NOT EXISTS post_id uuid;
      ALTER TABLE content_features ADD COLUMN IF NOT EXISTS modality text DEFAULT 'text';
      ALTER TABLE content_features ADD COLUMN IF NOT EXISTS model_version text DEFAULT 'legacy';
      ALTER TABLE content_features ADD COLUMN IF NOT EXISTS feature_json jsonb DEFAULT '{}'::jsonb;
      ALTER TABLE content_features ADD COLUMN IF NOT EXISTS status text DEFAULT 'ready';
      ALTER TABLE content_features ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
      ALTER TABLE content_features ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
      ALTER TABLE content_features ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ALTER TABLE content_features ALTER COLUMN modality SET DEFAULT 'text';
      ALTER TABLE content_features ALTER COLUMN model_version SET DEFAULT 'legacy';
      ALTER TABLE content_features ALTER COLUMN feature_json SET DEFAULT '{}'::jsonb;
      ALTER TABLE content_features ALTER COLUMN status SET DEFAULT 'ready';
      ALTER TABLE content_features ALTER COLUMN created_at SET DEFAULT now();
      ALTER TABLE content_features ALTER COLUMN updated_at SET DEFAULT now();
      UPDATE content_features SET id=COALESCE(id,gen_random_uuid()), modality=COALESCE(modality,'text'), model_version=COALESCE(model_version,'legacy'), feature_json=COALESCE(feature_json,'{}'::jsonb), status=COALESCE(status,'ready'), created_at=COALESCE(created_at,now()), updated_at=COALESCE(updated_at,now());
      CREATE INDEX IF NOT EXISTS content_features_post_idx ON content_features(post_id,modality,updated_at DESC);
      CREATE INDEX IF NOT EXISTS content_features_asset_idx ON content_features(asset_id,modality,updated_at DESC);
    END IF;
  END $$;`);
  await client.query(`DO $$ BEGIN
    IF to_regclass('public.security_events') IS NOT NULL THEN
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS user_id uuid;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS actor_id uuid;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'unknown';
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS resource_type text;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS resource_id text;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS ip_hash text;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS user_agent_hash text;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS success boolean DEFAULT true;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
      UPDATE security_events SET actor_id=COALESCE(actor_id,user_id), event_type=COALESCE(event_type,'unknown'), metadata=COALESCE(metadata,'{}'::jsonb), created_at=COALESCE(created_at,now());
      CREATE INDEX IF NOT EXISTS security_events_actor_time_idx ON security_events(actor_id,created_at DESC);
      CREATE INDEX IF NOT EXISTS security_events_type_time_idx ON security_events(event_type,created_at DESC);
    END IF;
  END $$;`);
  await client.query(`DO $$ BEGIN
    IF to_regclass('public.privacy_consents') IS NOT NULL THEN
      ALTER TABLE privacy_consents ADD COLUMN IF NOT EXISTS consent_type text DEFAULT 'general';
      ALTER TABLE privacy_consents ADD COLUMN IF NOT EXISTS version text DEFAULT '1';
      ALTER TABLE privacy_consents ADD COLUMN IF NOT EXISTS granted boolean DEFAULT false;
      ALTER TABLE privacy_consents ADD COLUMN IF NOT EXISTS granted_at timestamptz;
      ALTER TABLE privacy_consents ADD COLUMN IF NOT EXISTS revoked_at timestamptz;
      ALTER TABLE privacy_consents ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
      UPDATE privacy_consents SET consent_type=COALESCE(consent_type,'general'), version=COALESCE(version,'1'), granted=COALESCE(granted,false), created_at=COALESCE(created_at,now());
    END IF;
  END $$;`);
  await client.query(`DO $$ BEGIN
    IF to_regclass('public.devices') IS NOT NULL AND to_regclass('public.users') IS NOT NULL THEN
      DELETE FROM devices d WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id=d.user_id);
      IF NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conrelid='public.devices'::regclass AND c.contype='f' AND c.conname='devices_user_id_fkey') THEN
        ALTER TABLE devices ADD CONSTRAINT devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END $$;`);
}

async function main(){
  const client=await pool.connect();
  try{
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations(version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    for(const file of files){
      const exists=await client.query('SELECT 1 FROM schema_migrations WHERE version=$1',[file]);
      if(exists.rowCount)continue;
      await client.query('BEGIN');
      try{
        await ensureCompatibility(client);
        const sql=await readFile(join(process.cwd(),'sql',file),'utf8');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(version) VALUES($1) ON CONFLICT DO NOTHING',[file]);
        await client.query('COMMIT');
        console.log(`applied ${file}`);
      }catch(error){await client.query('ROLLBACK');throw new Error(`Migration ${file} failed: ${error instanceof Error?error.message:String(error)}`);}
    }
  }finally{client.release();await pool.end();}
}
main().catch(error=>{console.error(error);process.exit(1);});
