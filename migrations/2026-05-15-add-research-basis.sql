-- Migration: add research_basis to activity_submissions
-- Created 2026-05-15 for gap G (optional citation field on the contribute form).
-- Safe to re-run; uses IF NOT EXISTS.
--
-- Lets contributors point to the research, practice guide, or evidence base
-- behind their suggested activity. Optional; nullable. Surfaces on the
-- search page as a small footer line and on the admin review page so the
-- human reviewer can sanity-check the claim.

ALTER TABLE activity_submissions
  ADD COLUMN IF NOT EXISTS research_basis TEXT;
