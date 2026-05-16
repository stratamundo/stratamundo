-- Migration: add mastery_map_initial snapshot to assessments
-- Created 2026-05-15 for gap 4 (plan diff — "what changed since first analysis").
-- Safe to re-run; uses IF NOT EXISTS.
--
-- Background: focused-probe assessments mutate their parent's mastery_map
-- in place (analyze-assessment/route.ts:208–239). That means after a
-- single probe, the original analysis result is gone. To show the guide
-- a diff like "3.NF.A.3.a moved from misconception → demonstrated" we
-- need to keep the first-analyzed state around.
--
-- We snapshot the mastery map ONCE — the first time analyze-assessment
-- successfully writes a non-null mastery_map for a 'full' assessment.
-- Probes never touch this column. Existing rows stay NULL and the UI
-- treats NULL as "no diff available yet."

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS mastery_map_initial JSONB;
