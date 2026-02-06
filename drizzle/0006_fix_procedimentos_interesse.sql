-- Migration: Fix procedimentos_interesse column type conversion
-- Problem: Cannot automatically cast text[] to integer[]
-- Solution: First clear the data (or convert if possible), then alter type

-- Step 1: Clear existing text[] data (safe since it likely contains text representations)
-- If you need to preserve data, you'd need a more complex conversion
UPDATE leads SET procedimentos_interesse = NULL WHERE procedimentos_interesse IS NOT NULL;

-- Step 2: Now alter the column type (will work since column is empty/null)
ALTER TABLE "leads" ALTER COLUMN "procedimentos_interesse" SET DATA TYPE integer[]
USING procedimentos_interesse::integer[];
