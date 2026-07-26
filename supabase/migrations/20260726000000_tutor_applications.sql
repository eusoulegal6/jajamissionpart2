CREATE TABLE tutor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  languages_taught TEXT,
  current_platforms TEXT,
  package_5_class_price TEXT,
  package_10_class_price TEXT,
  preferred_payout TEXT,
  payout_details TEXT,
  experience_years TEXT,
  availability_notes TEXT,
  submission_ip TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed BOOLEAN DEFAULT false,
  notes TEXT
);

ALTER TABLE tutor_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert" ON tutor_applications FOR INSERT WITH CHECK (true);
