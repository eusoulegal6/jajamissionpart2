CREATE TABLE public.teacher_sessions (
  token text PRIMARY KEY,
  phone_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

GRANT ALL ON public.teacher_sessions TO service_role;

ALTER TABLE public.teacher_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX teacher_sessions_expires_at_idx ON public.teacher_sessions(expires_at);