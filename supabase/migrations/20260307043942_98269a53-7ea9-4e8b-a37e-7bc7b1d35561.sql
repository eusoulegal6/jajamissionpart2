
-- Table for group classes
CREATE TABLE public.group_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT '',
  badge TEXT NOT NULL DEFAULT '',
  teachers TEXT NOT NULL DEFAULT '',
  days TEXT NOT NULL DEFAULT '',
  display_time TEXT NOT NULL DEFAULT '',
  start_time TEXT NOT NULL DEFAULT '00:00',
  link TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for page settings
CREATE TABLE public.resource_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_url TEXT NOT NULL DEFAULT 'https://tutorvirtualnewhorizons.com.br/',
  tutorial_url TEXT NOT NULL DEFAULT 'https://youtu.be/pNy3IstuRZk?si=bqnbRmkg8EsvxdD6',
  page_title TEXT NOT NULL DEFAULT 'Aulas complementares e plataforma de estudos',
  page_subtitle TEXT NOT NULL DEFAULT 'Além das aulas particulares, os alunos da New Horizons também têm acesso à nossa plataforma de estudos e a aulas complementares em grupo em diferentes níveis e horários.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: public read for both tables
ALTER TABLE public.group_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_page_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read group_classes" ON public.group_classes FOR SELECT USING (true);
CREATE POLICY "Anyone can read resource_page_settings" ON public.resource_page_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert group_classes" ON public.group_classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update group_classes" ON public.group_classes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete group_classes" ON public.group_classes FOR DELETE USING (true);
CREATE POLICY "Anyone can insert resource_page_settings" ON public.resource_page_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update resource_page_settings" ON public.resource_page_settings FOR UPDATE USING (true);

-- Seed initial classes
INSERT INTO public.group_classes (title, description, level, badge, days, display_time, start_time, teachers, link, sort_priority) VALUES
('Manhã norte-americana', 'Conversação em inglês com tutores nativos.', 'Intermediário', '100% Inglês', 'Terças e quintas', '08h (manhã)', '08:00', 'Gabby e Maudi', 'https://meet.google.com/zbc-uemj-unw', 0),
('Tardes com o fundador', 'Conversação e prática diretamente com o fundador e especialista em ensino de inglês.', 'Intermediário', 'Intermediário', 'Segunda a quinta', '15h', '15:00', 'Fundador / especialista', 'https://meet.google.com/zbc-uemj-unw', 0),
('Conversação Avançada', 'Aula de conversação com tutores nativos para alunos avançados.', 'Avançado', '100% Inglês', 'Segunda a quinta', '19h (noite)', '19:00', 'Gabby, Layla e Mushira', 'https://meet.google.com/zbc-uemj-unw', 0),
('Conversação Intermediária', 'Aula de conversação com tutores nativos para alunos de nível intermediário.', 'Intermediário', 'Intermediário', 'Segunda a quinta', '20h', '20:00', 'Débora e Mushira', 'https://meet.google.com/kxg-popg-qng', 0),
('Iniciando sua jornada', 'Aula para quem está começando e quer praticar com orientação de especialista.', 'Iniciante', 'Iniciante', 'Segunda a quinta', '20h (noite)', '20:00', 'Especialista', 'https://meet.google.com/tcj-ecne-pdt', 1);

-- Seed initial settings
INSERT INTO public.resource_page_settings (platform_url, tutorial_url, page_title, page_subtitle) VALUES
('https://tutorvirtualnewhorizons.com.br/', 'https://youtu.be/pNy3IstuRZk?si=bqnbRmkg8EsvxdD6', 'Aulas complementares e plataforma de estudos', 'Além das aulas particulares, os alunos da New Horizons também têm acesso à nossa plataforma de estudos e a aulas complementares em grupo em diferentes níveis e horários.');
