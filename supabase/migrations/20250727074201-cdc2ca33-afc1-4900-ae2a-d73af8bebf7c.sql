-- Insert Leitura category if it doesn't exist
INSERT INTO content_categories (id, name, description, "order", language)
VALUES ('pt-leitura', 'Leitura', 'Textos interessantes divididos por nível', 1, 'pt')
ON CONFLICT (id) DO NOTHING;

-- Insert Vídeos category if it doesn't exist  
INSERT INTO content_categories (id, name, description, "order", language)
VALUES ('pt-videos', 'Vídeos', 'Pratique imersão com vídeos divididos por nível', 2, 'pt')
ON CONFLICT (id) DO NOTHING;

-- Insert chapters for Leitura category
INSERT INTO content_chapters (id, title, description, "order", language, category_id)
VALUES 
  (gen_random_uuid(), 'Fácil', 'Textos de leitura para iniciantes', 1, 'pt', 'pt-leitura'),
  (gen_random_uuid(), 'Médio', 'Textos de leitura de nível intermediário', 2, 'pt', 'pt-leitura'),
  (gen_random_uuid(), 'Difícil', 'Textos de leitura avançados', 3, 'pt', 'pt-leitura')
ON CONFLICT DO NOTHING;

-- Insert chapters for Vídeos category
INSERT INTO content_chapters (id, title, description, "order", language, category_id)
VALUES 
  (gen_random_uuid(), 'Fácil', 'Vídeos para iniciantes', 1, 'pt', 'pt-videos'),
  (gen_random_uuid(), 'Médio', 'Vídeos de nível intermediário', 2, 'pt', 'pt-videos'),
  (gen_random_uuid(), 'Difícil', 'Vídeos avançados', 3, 'pt', 'pt-videos')
ON CONFLICT DO NOTHING;