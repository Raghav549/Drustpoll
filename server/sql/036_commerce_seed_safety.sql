CREATE INDEX IF NOT EXISTS product_variants_sku_idx ON product_variants(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS product_questions_product_created_idx ON product_questions(product_id,created_at DESC);
CREATE INDEX IF NOT EXISTS product_answers_question_created_idx ON product_answers(question_id,created_at ASC);
CREATE INDEX IF NOT EXISTS shop_metadata_slug_idx ON shops_metadata(slug) WHERE slug IS NOT NULL;
