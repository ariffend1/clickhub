-- ClickHub Enterprise Migration
-- Fitur: Title user, is_verified master data, seed data default
-- Tanggal: 2026-07-08

-- =================================================================
-- 1. Tambah kolom 'title' pada tabel User
-- =================================================================
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "title" text;

-- =================================================================
-- 2. Tambah kolom 'isVerified' pada tabel Location
-- =================================================================
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "isVerified" boolean DEFAULT true;

-- =================================================================
-- 3. Tambah kolom 'isVerified' pada tabel MasterData
-- =================================================================
ALTER TABLE "MasterData" ADD COLUMN IF NOT EXISTS "isVerified" boolean DEFAULT true;

-- =================================================================
-- 4. Tambah kolom 'requestedById' pada tabel Location & MasterData
--    (untuk tracking siapa yang mengajukan data baru)
-- =================================================================
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "requestedById" text;
ALTER TABLE "MasterData" ADD COLUMN IF NOT EXISTS "requestedById" text;

-- =================================================================
-- 5. Seed Data: Satuan (Unit) Default
-- =================================================================
INSERT INTO "MasterData" ("id", "category", "name", "isVerified", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'UNIT', 'pcs', true, now(), now()),
  (gen_random_uuid()::text, 'UNIT', 'unit', true, now(), now()),
  (gen_random_uuid()::text, 'UNIT', 'box', true, now(), now()),
  (gen_random_uuid()::text, 'UNIT', 'roll', true, now(), now()),
  (gen_random_uuid()::text, 'UNIT', 'meter', true, now(), now()),
  (gen_random_uuid()::text, 'UNIT', 'set', true, now(), now()),
  (gen_random_uuid()::text, 'UNIT', 'pack', true, now(), now()),
  (gen_random_uuid()::text, 'UNIT', 'liter', true, now(), now()),
  (gen_random_uuid()::text, 'UNIT', 'kg', true, now(), now()),
  (gen_random_uuid()::text, 'UNIT', 'lembar', true, now(), now()),
  (gen_random_uuid()::text, 'UNIT', 'batang', true, now(), now()),
  (gen_random_uuid()::text, 'UNIT', 'buah', true, now(), now()),
  (gen_random_uuid()::text, 'UNIT', 'rim', true, now(), now()),
  (gen_random_uuid()::text, 'UNIT', 'botol', true, now(), now()),
  (gen_random_uuid()::text, 'UNIT', 'pasang', true, now(), now()),
  (gen_random_uuid()::text, 'UNIT', 'galon', true, now(), now()),
  (gen_random_uuid()::text, 'UNIT', 'kaleng', true, now(), now()),
  (gen_random_uuid()::text, 'UNIT', 'tablet', true, now(), now())
ON CONFLICT DO NOTHING;

-- =================================================================
-- 6. Seed Data: Tipe Aset Default (dari hardcoded di frontend)
-- =================================================================
INSERT INTO "MasterData" ("id", "category", "name", "isVerified", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'ASSET_TYPE', 'Laptop', true, now(), now()),
  (gen_random_uuid()::text, 'ASSET_TYPE', 'Desktop', true, now(), now()),
  (gen_random_uuid()::text, 'ASSET_TYPE', 'Server', true, now(), now()),
  (gen_random_uuid()::text, 'ASSET_TYPE', 'Printer', true, now(), now()),
  (gen_random_uuid()::text, 'ASSET_TYPE', 'Switch', true, now(), now()),
  (gen_random_uuid()::text, 'ASSET_TYPE', 'Monitor', true, now(), now()),
  (gen_random_uuid()::text, 'ASSET_TYPE', 'Phone', true, now(), now()),
  (gen_random_uuid()::text, 'ASSET_TYPE', 'Router', true, now(), now()),
  (gen_random_uuid()::text, 'ASSET_TYPE', 'Access Point', true, now(), now()),
  (gen_random_uuid()::text, 'ASSET_TYPE', 'UPS', true, now(), now()),
  (gen_random_uuid()::text, 'ASSET_TYPE', 'CCTV', true, now(), now()),
  (gen_random_uuid()::text, 'ASSET_TYPE', 'Scanner', true, now(), now()),
  (gen_random_uuid()::text, 'ASSET_TYPE', 'Projector', true, now(), now()),
  (gen_random_uuid()::text, 'ASSET_TYPE', 'Other', true, now(), now())
ON CONFLICT DO NOTHING;
