-- Migration: Add tier 2 professional and business fields to lawyers table
-- Financial information
ALTER TABLE lawyers ADD COLUMN fee_structure TEXT;
ALTER TABLE lawyers ADD COLUMN consultation_type TEXT;
ALTER TABLE lawyers ADD COLUMN payment_methods TEXT;

-- Professional credentials
ALTER TABLE lawyers ADD COLUMN professional_memberships TEXT;
ALTER TABLE lawyers ADD COLUMN certifications TEXT;
ALTER TABLE lawyers ADD COLUMN peer_ratings TEXT;

-- Accessibility & contact
ALTER TABLE lawyers ADD COLUMN emergency_contact TEXT;
ALTER TABLE lawyers ADD COLUMN virtual_consultation TEXT;
ALTER TABLE lawyers ADD COLUMN response_time TEXT;

-- Practice details
ALTER TABLE lawyers ADD COLUMN subspecialties TEXT;
ALTER TABLE lawyers ADD COLUMN client_types TEXT;

-- Add indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_lawyers_fee_structure ON lawyers(fee_structure);
CREATE INDEX IF NOT EXISTS idx_lawyers_consultation_type ON lawyers(consultation_type);
CREATE INDEX IF NOT EXISTS idx_lawyers_virtual_consultation ON lawyers(virtual_consultation);
CREATE INDEX IF NOT EXISTS idx_lawyers_emergency_contact ON lawyers(emergency_contact);
CREATE INDEX IF NOT EXISTS idx_lawyers_professional_memberships ON lawyers(professional_memberships);
CREATE INDEX IF NOT EXISTS idx_lawyers_certifications ON lawyers(certifications);
CREATE INDEX IF NOT EXISTS idx_lawyers_peer_ratings ON lawyers(peer_ratings);
