CREATE TABLE public.secretaria_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('grupo','particular','trial')),
  data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.secretaria_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read secretaria_schedules"
  ON public.secretaria_schedules FOR SELECT USING (true);
CREATE POLICY "Anyone can insert secretaria_schedules"
  ON public.secretaria_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update secretaria_schedules"
  ON public.secretaria_schedules FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete secretaria_schedules"
  ON public.secretaria_schedules FOR DELETE USING (true);

CREATE INDEX idx_secretaria_schedules_kind_created ON public.secretaria_schedules(kind, created_at DESC);