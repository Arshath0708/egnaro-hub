-- ==============================================================================
-- Egnaro Mart - Database migration to ensure vendor GST is uppercase
-- ==============================================================================
UPDATE vendors SET gst = UPPER(TRIM(gst)) WHERE gst IS NOT NULL AND gst != '';
