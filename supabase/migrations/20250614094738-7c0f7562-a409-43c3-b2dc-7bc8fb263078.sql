
-- 1. Remove existing questions
TRUNCATE TABLE public.perguntas_facil RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.perguntas_medio RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.perguntas_dificil RESTART IDENTITY CASCADE;

-- 2. Insert English sample questions and themes

-- EASY QUESTIONS
INSERT INTO public.perguntas_facil (category, question) VALUES
('Hobbies',       'What is your favorite hobby?'),
('Hobbies',       'Describe a hobby you would like to try.'),
('Daily Life',    'What do you usually eat for breakfast?'),
('Daily Life',    'How do you get to school or work?'),
('Travel',        'Have you ever traveled to another city? Where?'),
('Travel',        'Do you prefer the beach or the mountains? Why?'),
('Family',        'Tell me about your family.'),
('Family',        'Do you have any siblings? What are their names?'),
('Movies',        'What is your favorite movie and why?'),
('Movies',        'Describe a movie you watched recently.'),
('Music',         'What kind of music do you like?'),
('Food',          'What is your favorite food?'),
('Food',          'Do you like to cook? What do you cook best?'),
('Weather',       'What is the weather like today?'),
('Weather',       'What is your favorite season? Why?')
;

-- MEDIUM QUESTIONS
INSERT INTO public.perguntas_medio (category, question) VALUES
('Dreams',        'Describe one of your dreams for the future.'),
('Dreams',        'What would you do if you won the lottery?'),
('Travel',        'If you could visit any country, where would you go and why?'),
('Travel',        'What was your best travel experience?'),
('Education',     'What is the most important thing you have learned in school?'),
('Education',     'Do you prefer studying alone or in groups? Why?'),
('Technology',    'How has technology changed your life?'),
('Technology',    'What app do you use the most?'),
('Sports',        'Do you play or watch any sports? Which ones?'),
('Sports',        'What is a sport you would like to learn?'),
('Culture',       'Describe a tradition in your country.'),
('Culture',       'Is it important to preserve cultural traditions? Why or why not?'),
('Books',         'What book has influenced you the most?'),
('Books',         'Do you prefer e-books or physical books? Why?')
;

-- HARD QUESTIONS
INSERT INTO public.perguntas_dificil (category, question) VALUES
('Environment',      'What are the most serious environmental problems today and how can we solve them?'),
('Environment',      'Do you think individuals or governments should be responsible for protecting the environment?'),
('Career',           'What qualities are important for success in your career?'),
('Career',           'Describe a difficult choice you had to make at work or school.'),
('Society',          'Do you agree or disagree that social media has a positive impact on society? Explain.'),
('Society',          'What are the challenges of living in a multicultural society?'),
('Health',           'How can governments promote healthier lifestyles?'),
('Health',           'Should governments limit fast food advertising to children? Why or why not?'),
('Technology',       'How might artificial intelligence change the future of work?'),
('Technology',       'What new technology do you wish existed, and why?'),
('Travel',           'How does travel change your perspective about the world?'),
('Travel',           'What are the advantages and disadvantages of living abroad?')
;
