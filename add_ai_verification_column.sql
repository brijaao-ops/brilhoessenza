-- Add AI verification result column to delivery_drivers
ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS ai_verification_result TEXT;

-- Update RLS if necessary (usually public can insert, so it should be fine)
-- But let's ensure the column is accessible
COMMENT ON COLUMN delivery_drivers.ai_verification_result IS 'Armazena o resultado da verificação biométrica em formato JSON via Gemini AI';
