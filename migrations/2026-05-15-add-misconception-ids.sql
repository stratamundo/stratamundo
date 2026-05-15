-- Migration: add misconception_ids to activity_submissions
-- Created 2026-05-15 for gap B (surface misconception tags on the search page).
-- Safe to re-run; uses IF NOT EXISTS.
--
-- Background: the AI vet already infers which misconceptions a submission
-- helps resolve (vetResult.suggested_misconception_ids), but until now we
-- threw that away. Persisting it lets the search page filter activities
-- by the misconception they target — matching how the curated library
-- (content/fractions-resources.json) already tags every resource.

ALTER TABLE activity_submissions
  ADD COLUMN IF NOT EXISTS misconception_ids TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_activity_submissions_misconception_ids
  ON activity_submissions USING GIN (misconception_ids);
