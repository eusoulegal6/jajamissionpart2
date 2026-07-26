import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export type LearningLanguage = 'en' | 'es';
export type UILanguage = 'pt' | 'es';

// Speculative fix for build error in un-editable file: QuestionsThemeScreen.tsx
export type Language = LearningLanguage;

interface LanguageContextType {
  uiLanguage: UILanguage;
  setUiLanguage: (language: UILanguage) => void;
  learningLanguage: LearningLanguage;
  setLearningLanguage: (language: LearningLanguage) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
  tLesson: (key: string, replacements?: Record<string, string>) => string;
  // Speculative fix for build error in un-editable file: QuestionsThemeScreen.tsx
  language: LearningLanguage;
}

// Speculative fix for build error in un-editable file: QuestionsThemeScreen.tsx
const translations: Record<string, Record<UILanguage, string>> = {
  // HomeScreen translations
  tutor_virtual: { pt: 'Tutor Virtual', es: 'Tutor Virtual' },
  escolha_modo: { pt: 'Escolha um modo de aprendizado:', es: 'Elige un modo de aprendizaje:' },
  pergunte_especialista: { pt: 'Pergunte ao especialista', es: 'Pregúntale al experto' },
  faca_pergunta: { pt: 'Faça qualquer pergunta ao professor de {language}', es: 'Haz cualquer pregunta al profesor de {language}' },
  pratica_conversacao: { pt: 'Prática de conversação', es: 'Práctica de conversación' },
  pratique_conversas: { pt: 'Pratique conversas em {language}', es: 'Practica conversaciones en {language}' },
  licoes_completas: { pt: '📚 Lições Completas', es: '📚 Lecciones Completas' },
  acesse_licoes: { pt: 'Acesse lições estruturadas com exercícios', es: 'Accede a lecciones estructuradas con ejercicios' },
  entrevista_emprego: { pt: 'Entrevista de emprego', es: 'Entrevista de trabajo' },
  simule_entrevista: { pt: 'Simule uma entrevista de trabalho em {language}', es: 'Simula una entrevista de trabajo en {language}' },
  quiz: { pt: 'Quiz', es: 'Quiz' },
  teste_conhecimento: { pt: 'Teste seu conhecimento', es: 'Pon a prueba tus conocimientos' },
  jogos: { pt: 'Jogos', es: 'Juegos' },
  divirta_se: { pt: 'Divirta-se enquanto pratica {language} com 3 jogos interativos!', es: '¡Diviértete mientras practicas {language} con 3 juegos interactivos!' },
  pratica_escuta: { pt: 'Prática de escuta', es: 'Práctica de escucha' },
  melhore_escuta: { pt: 'Melhore sua escuta digitando o que ouve', es: 'Mejora tu escucha escribiendo lo que oyes' },
  perguntas: { pt: 'Perguntas', es: 'Preguntas' },
  responda_perguntas: { pt: 'Responda perguntas e pratique conversação', es: 'Responde preguntas y practica conversación' },
  simulacao: { pt: 'Simulação (Role-play)', es: 'Simulación (Role-play)' },
  simule_situacoes: { pt: 'Simule situações reais com correções no final', es: 'Simula situaciones reales con correcciones al final' },
  aulas_particulares: { pt: 'Aulas particulares', es: 'Clases particulares' },
  aulas_conversacao_nativos: { pt: 'Aulas de conversação com nativos', es: 'Clases de conversación con nativos' },
  mudar_aprendizado: { pt: 'Mudar idioma de aprendizado', es: 'Cambiar idioma de aprendizaje' },
  aprendendo_agora: { pt: 'Atualmente aprendendo: {language}', es: 'Actualmente aprendiendo: {language}' },
  progress: { pt: 'Progresso', es: 'Progreso' },
  total_progress: { pt: 'Progresso total', es: 'Progreso total' },
  // QuestionsDifficultyScreen translations
  perguntas_escolha_dificuldade: { pt: 'Perguntas - Escolha a dificuldade', es: 'Preguntas - Elige la dificultad' },
  dificuldade_facil_desc: { pt: 'Perguntas simples e diretas, ótimo para iniciantes e prática básica.', es: 'Preguntas simples y directas, ideal para principiantes y práctica básica.' },
  dificuldade_medio_desc: { pt: 'Perguntas para quem já domina frases cotidianas e vocabulário essencial.', es: 'Preguntas para quienes ya dominan frases cotidianas y vocabulario esencial.' },
  dificuldade_dificil_desc: { pt: 'Perguntas desafiadoras sobre temas e situações avançadas.', es: 'Preguntas desafiantes sobre temas y situaciones avanzadas.' },
  voltar: { pt: 'Voltar', es: 'Volver' },
  // QuestionsThemeScreen translations
  escolha_o_tema: { pt: 'Escolha o tema', es: 'Elige el tema' },
  aleatorio: { pt: 'Aleatório', es: 'Aleatorio' },
  carregando_temas: { pt: 'Carregando temas...', es: 'Cargando temas...' },
  nenhum_tema_encontrado: { pt: 'Nenhum tema encontrado.', es: 'No se encontraron temas.' },
  aleatorio_title: { pt: 'Escolher um tema aleatório', es: 'Elegir un tema aleatorio' },
  dificuldade_invalida: { pt: "Dificuldade inválida.", es: "Dificultad inválida." },
  erro_carregar_temas: { pt: "Erro ao carregar temas.", es: "Error al cargar temas." },
  erro_inesperado_temas: { pt: "Erro inesperado al buscar temas.", es: "Error inesperado al buscar temas." },
  // Fetch questions errors
  invalid_difficulty: { pt: 'Dificuldade ou idioma inválido.', es: 'Dificultad o idioma no válido.' },
  fetch_error: { pt: 'Erro ao buscar perguntas.', es: 'Error al buscar las preguntas.' },
  no_questions_found: { pt: 'Nenhuma pergunta encontrada para esse tema.', es: 'No se encontraron preguntas para este tema.' },
  // AIFeedbackPage translations
  activity_completed: { pt: 'Atividade concluída!', es: '¡Actividad completada!' },
  you_completed_all_questions: { pt: 'Você completou todas as perguntas! Parabéns pelo esforço.', es: '¡Has completado todas las preguntas! Felicitaciones por tu esfuerzo.' },
  continue_lesson: { pt: 'Continuar lição', es: 'Continuar lección' },
  try_again: { pt: 'Tentar Novamente', es: 'Intentar de nuevo' },
  restart_activity: { pt: 'Recomeçar atividade', es: 'Reiniciar actividad' },
  questions_in_english: { pt: 'Perguntas em Inglês', es: 'Preguntas en Inglés' },
  questions_in_spanish: { pt: 'Perguntas em Espanhol', es: 'Preguntas en Español' },
  english_questions: { pt: 'English Questions', es: 'English Questions' },
  spanish_questions: { pt: 'Spanish Questions', es: 'Spanish Questions' },
  question_x_of_y: { pt: 'Question {questionIndex} of {questionCount}', es: 'Pregunta {questionIndex} de {questionCount}' },
  skip: { pt: 'Skip', es: 'Saltar' },
  write_your_answer_or_use_mic: { pt: 'Escreva sua resposta aqui ou use o microfone...', es: 'Escribe tu respuesta aquí o usa el micrófono...' },
  analyzing_answer: { pt: 'Analisando resposta...', es: 'Analizando respuesta...' },
  answer_button: { pt: 'Answer', es: 'Responder' },
  teachers_feedback: { pt: "Feedback do Professor", es: 'Feedback del Profesor' },
  what_you_said: { pt: 'O que você disse', es: 'Lo que dijiste' },
  pause_audio: { pt: 'Pausar áudio', es: 'Pausar audio' },
  listen_to_your_answer: { pt: 'Ouça sua resposta', es: 'Escucha tu respuesta' },
  how_native_speaker_says: { pt: 'Como um nativo diria', es: 'Cómo lo diría un hablante nativo' },
  loading: { pt: 'Carregando...', es: 'Cargando...' },
  pause_native: { pt: 'Pausar nativo', es: 'Pausar nativo' },
  listen_to_native: { pt: 'Ouvir nativo', es: 'Escuchar nativo' },
  finish_activity: { pt: 'Finalizar atividade', es: 'Finalizar actividad' },
  next_question: { pt: 'Próxima pergunta', es: 'Siguiente pregunta' },
  feedback_error: { pt: 'Desculpe, não consegui fornecer feedback neste momento. Por favor, tente novamente.', es: 'Lo siento, no pude proporcionar feedback en este momento. Por favor, inténtalo de nuevo.' },
  // HomeScreen card translations
  licoes_completas_card: { pt: 'Lições Completas', es: 'Lecciones Completas' },
  pergunte_professor: { pt: 'Pergunte ao professor', es: 'Pregúntale al profesor' },
  flashcards_card: { pt: 'Flashcards', es: 'Flashcards' },
  audio_flashcards_card: { pt: 'Audio Flashcards', es: 'Audio Flashcards' },
  curso_completo_card: { pt: 'Curso Completo', es: 'Curso Completo' },
  tradutor_card: { pt: 'Tradutor', es: 'Traductor' },
  pnl_card: { pt: 'PNL', es: 'PNL' },
  tutorial_card: { pt: 'Tutorial', es: 'Tutorial' },
  criar_licao: { pt: 'Criar Lição', es: 'Crear Lección' },
  criar_slideshow: { pt: 'Criar Slideshow', es: 'Crear Slideshow' },
  // DifficultySelectionScreen translations
  selecione_nivel: { pt: 'Selecione o seu nível', es: 'Selecciona tu nivel' },
  licoes_header: { pt: 'Lições', es: 'Lecciones' },
  clique_selecionar: { pt: 'Clique para selecionar', es: 'Haz clic para seleccionar' },
  dificuldade_facil_title: { pt: 'Fácil', es: 'Fácil' },
  dificuldade_facil_description: { pt: 'Ideal para iniciantes. Vocabulário básico e estruturas simples.', es: 'Ideal para principiantes. Vocabulario básico y estructuras simples.' },
  dificuldade_medio_title: { pt: 'Médio', es: 'Medio' },
  dificuldade_medio_description: { pt: 'Para quem já tem conhecimento básico. Conversações cotidianas.', es: 'Para quienes ya tienen conocimiento básico. Conversaciones cotidianas.' },
  dificuldade_dificil_title: { pt: 'Difícil', es: 'Difícil' },
  dificuldade_dificil_description: { pt: 'Nível avançado. Textos complexos e discussões profundas.', es: 'Nivel avanzado. Textos complejos y discusiones profundas.' },
  dificuldade_fluente_title: { pt: 'Fluente / Business', es: 'Fluido / Business' },
  dificuldade_fluente_description: { pt: 'Nível profissional. Comunicação empresarial e fluência avançada.', es: 'Nivel profesional. Comunicación empresarial y fluidez avanzada.' },
  // CompleteLessonsScreen translations
  carregando_licoes: { pt: 'Carregando lições...', es: 'Cargando lecciones...' },
  nenhuma_licao: { pt: 'Nenhuma lição encontrada', es: 'No se encontraron lecciones' },
  nenhuma_licao_desc: { pt: 'Não há lições disponíveis para esta dificuldade no momento.', es: 'No hay lecciones disponibles para esta dificultad en este momento.' },
  nenhuma_licao_tipo: { pt: 'Não há lições deste tipo disponíveis.', es: 'No hay lecciones de este tipo disponibles.' },
  tipo_filtro: { pt: 'Tipo:', es: 'Tipo:' },
  todos: { pt: 'Todos', es: 'Todos' },
  video_filtro: { pt: 'Vídeo', es: 'Video' },
  audio_filtro: { pt: 'Áudio', es: 'Audio' },
  texto_filtro: { pt: 'Texto', es: 'Texto' },
  sair: { pt: 'Sair', es: 'Salir' },
  ola: { pt: 'Olá', es: 'Hola' },
  // Audio playback translations
  play_audio: { pt: 'Listen', es: 'Play audio' },
  // True/False Quiz translations
  true: { pt: 'Verdadeiro', es: 'Verdadero' },
  false: { pt: 'Falso', es: 'Falso' },
  correct: { pt: 'Correto!', es: '¡Correcto!' },
  incorrect: { pt: 'Incorreto', es: 'Incorrecto' },
  correct_answer: { pt: 'Resposta Correta:', es: 'Respuesta Correcta:' },
  explanation: { pt: 'Explicação:', es: 'Explicación:' },
  quiz_complete: { pt: 'Quiz Completo!', es: '¡Quiz Completo!' },
  you_completed_quiz: { pt: 'Você completou este quiz!', es: '¡Has completado este quiz!' },
  take_quiz_again: { pt: 'Fazer Quiz Novamente', es: 'Hacer Quiz de Nuevo' },
  question_x_of_y_quiz: { pt: 'Pergunta {questionIndex} de {questionCount}', es: 'Pregunta {questionIndex} de {questionCount}' },
  complete_quiz: { pt: 'Completar Quiz', es: 'Completar Quiz' },
  next_question_quiz: { pt: 'Próxima Pergunta', es: 'Siguiente Pregunta' },
  // Setup screen translations
  simulacao_title: { pt: 'Simulação (Role-play)', es: 'Simulación (Role-play)' },
  escolha_dificuldade: { pt: 'Escolha a dificuldade:', es: 'Elige la dificultad:' },
  escolha_situacao: { pt: 'Escolha a situação:', es: 'Elige la situación:' },
  comecar: { pt: 'Começar', es: 'Empezar' },
  pratica_conversacao_title: { pt: 'Prática de conversação', es: 'Práctica de conversación' },
  escolha_nivel: { pt: 'Escolha seu nível:', es: 'Elige tu nivel:' },
  basico: { pt: 'Básico', es: 'Básico' },
  intermediario: { pt: 'Intermediário', es: 'Intermedio' },
  avancado: { pt: 'Avançado', es: 'Avanzado' },
  deseja_correcoes: { pt: 'Você deseja correções durante a conversa?', es: '¿Deseas correcciones durante la conversación?' },
  com_correcao: { pt: 'Com correção', es: 'Con corrección' },
  sem_correcao: { pt: 'Sem correção', es: 'Sin corrección' },
  dica_conversacao: { pt: 'Dica: você pode escolher um dos temas sugeridos ou digitar qualquer outro assunto que queira conversar!', es: '¡Consejo: puedes elegir uno de los temas sugeridos o escribir cualquier otro tema del que quieras conversar!' },
  comecar_conversa: { pt: 'Começar conversa', es: 'Empezar conversación' },
  // Interview setup
  entrevista_title: { pt: 'Entrevista de emprego', es: 'Entrevista de trabajo' },
  entrevista_desc: { pt: 'Neste modo, você vai simular uma entrevista de emprego com 5 perguntas específicas para a sua área de atuação. Ao final, você receberá um feedback completo com sugestões de inglês e também de entrevista.', es: 'En este modo, simularás una entrevista de trabajo con 5 preguntas específicas para tu área de trabajo. Al final, recibirás un feedback completo con sugerencias de español y también de entrevista.' },
  entrevista_recomendado: { pt: 'Recomendado para alunos de nível intermediário e avançado.', es: 'Recomendado para estudiantes de nivel intermedio y avanzado.' },
  iniciar_entrevista: { pt: 'Iniciar Entrevista', es: 'Iniciar Entrevista' },
  // Quiz setup
  escolha_dificuldade_quiz: { pt: 'Escolha a dificuldade:', es: 'Elige la dificultad:' },
  basico_quiz: { pt: 'Básico', es: 'Básico' },
  intermediario_avancado: { pt: 'Intermediário / Avançado', es: 'Intermedio / Avanzado' },
  dificuldade_quiz_desc: { pt: 'A dificuldade não muda o conteúdo das perguntas, mas sim o nível de vocabulário e a complexidade do texto em inglês.', es: 'La dificultad no cambia el contenido de las preguntas, sino el nivel de vocabulario y la complejidad del texto en español.' },
  escolha_tema: { pt: 'Escolha um tema:', es: 'Elige un tema:' },
  dica_quiz: { pt: 'Dica: você pode escolher um dos temas sugeridos ou digitar outro assunto de sua preferência!', es: '¡Consejo: puedes elegir uno de los temas sugeridos o escribir otro tema de tu preferencia!' },
  outro_tema: { pt: 'Outro tema', es: 'Otro tema' },
  digite_tema: { pt: 'Digite o tema de sua preferência:', es: 'Escribe el tema de tu preferencia:' },
  iniciar_quiz: { pt: 'Iniciar Quiz', es: 'Iniciar Quiz' },
  // Listening setup
  listening_title: { pt: 'Listening Practice', es: 'Práctica de Escucha' },
  listening_choose_difficulty: { pt: 'Choose the difficulty:', es: 'Elige la dificultad:' },
  como_funciona: { pt: 'Como funciona:', es: 'Cómo funciona:' },
  listening_step1: { pt: 'Clique no botão de play para ouvir uma frase', es: 'Haz clic en el botón de play para escuchar una frase' },
  listening_step2: { pt: 'Digite / Fale exatamente o que você ouviu', es: 'Escribe / Di exactamente lo que escuchaste' },
  listening_step3: { pt: 'Receba feedback e sua pontuação!', es: '¡Recibe feedback y tu puntuación!' },
  // Games setup
  jogos_interativos: { pt: 'Jogos Interativos', es: 'Juegos Interactivos' },
  escolha_jogo: { pt: 'Escolha um jogo para praticar inglês enquanto se diverte:', es: 'Elige un juego para practicar español mientras te diviertes:' },
  quiz_desc_games: { pt: 'Teste seus conhecimentos com perguntas interativas', es: 'Pon a prueba tus conocimientos con preguntas interactivas' },
  dream_painter_desc: { pt: 'Crie uma pintura com a ajuda da IA', es: 'Crea una pintura con la ayuda de la IA' },
  real_world_hunt_desc: { pt: 'Encontre objetos reais e tire fotos', es: 'Encuentra objetos reales y toma fotos' },
  // Daily lesson
  licao_do_dia: { pt: 'Lição do dia', es: 'Lección del día' },
  iniciar_licao: { pt: 'Iniciar Lição', es: 'Iniciar Lección' },
  // ChatInterface
  nova_conversa: { pt: 'Nova conversa', es: 'Nueva conversación' },
  pronuncia: { pt: 'Pronúncia', es: 'Pronunciación' },
  pergunte_qualquer: { pt: 'Pergunte qualquer coisa', es: 'Pregunta lo que quieras' },
  envie_mensagem: { pt: 'Envie uma mensagem para começar a conversa', es: 'Envía un mensaje para comenzar la conversación' },
  pensando: { pt: 'Thinking...', es: 'Pensando...' },
  mensagem_placeholder: { pt: 'Mensagem', es: 'Mensaje' },
  gravacao_andamento: { pt: 'Gravação em andamento...', es: 'Grabación en curso...' },
  como_nativo_falaria: { pt: 'Como um nativo falaria:', es: 'Cómo lo diría un nativo:' },
  sua_transcricao: { pt: 'Sua transcrição:', es: 'Tu transcripción:' },
  o_que_voce_falou: { pt: 'O que você falou:', es: 'Lo que dijiste:' },
  audio_original: { pt: 'Áudio original:', es: 'Audio original:' },
  // AIFeedbackPage
  gramatica_estrutura: { pt: 'Gramática e estrutura', es: 'Gramática y estructura' },
  analisando: { pt: 'Analisando...', es: 'Analizando...' },
  perfeito: { pt: 'Perfeito!', es: '¡Perfecto!' },
  erro: { pt: 'erro', es: 'error' },
  erros: { pt: 'erros', es: 'errores' },
  preparando_portugues: { pt: 'Preparando explicação em português...', es: 'Preparando explicación en portugués...' },
  traduzindo: { pt: 'Traduzindo...', es: 'Traduciendo...' },
  explicar_portugues: { pt: 'Explicar em português', es: 'Explicar en portugués' },
  explicacao_portugues: { pt: '📝 Explicação em Português', es: '📝 Explicación en Portugués' },
  reproduzir_devagar: { pt: 'Reproduzir mais devagar', es: 'Reproducir más lento' },
  avaliando_pronuncia: { pt: 'Avaliando pronúncia...', es: 'Evaluando pronunciación...' },
  pronuncia_label: { pt: 'Pronúncia', es: 'Pronunciación' },
  clique_ver: { pt: 'Clique para ver', es: 'Haz clic para ver' },
  nenhum_erro: { pt: '✓ Nenhum erro', es: '✓ Sin errores' },
  palavras_erro_pronuncia: { pt: 'Palavras com erro de pronúncia', es: 'Palabras con error de pronunciación' },
  ativar_ia: { pt: 'Ativar I.A', es: 'Activar I.A' },
  em_breve: { pt: 'Em Breve', es: 'Próximamente' },
  em_breve_desc: { pt: 'Esta funcionalidade está sendo desenvolvida e estará disponível em breve.', es: 'Esta funcionalidad está siendo desarrollada y estará disponible pronto.' },
  voltar_inicio: { pt: 'Voltar ao início', es: 'Volver al inicio' },
  // DetailedCorrectionModal
  correcao_detalhada: { pt: 'Correção Detalhada', es: 'Corrección Detallada' },
  seu_texto_original: { pt: 'Seu texto original:', es: 'Tu texto original:' },
  texto_corrigido: { pt: 'Texto corrigido:', es: 'Texto corregido:' },
  texto_correto: { pt: '✅ Seu texto está correto!', es: '✅ ¡Tu texto es correcto!' },
  sem_erros_corrigir: { pt: 'Não foram encontrados erros para corrigir.', es: 'No se encontraron errores para corregir.' },
  correcoes_count: { pt: 'Correções', es: 'Correcciones' },
  palavra_corrigida: { pt: 'Esta palavra foi corrigida na versão final.', es: 'Esta palabra fue corregida en la versión final.' },
  palavra_adicionada: { pt: 'Esta palavra foi adicionada na versão corrigida.', es: 'Esta palabra fue añadida en la versión corregida.' },
  faltando: { pt: '(faltando)', es: '(falta)' },
  // SpecialistQuestionModal
  duvida_palavra: { pt: 'Tenho dúvida em uma palavra', es: 'Tengo duda sobre una palabra' },
  outra_duvida: { pt: 'Tenho outra dúvida', es: 'Tengo otra duda' },
  // RolePlay situations
  rp_restaurante: { pt: 'Pedindo comida em um restaurante', es: 'Pidiendo comida en un restaurante' },
  rp_hotel: { pt: 'Fazendo check-in em um hotel', es: 'Haciendo check-in en un hotel' },
  rp_conhecendo: { pt: 'Conhecendo alguém novo', es: 'Conociendo a alguien nuevo' },
  rp_roupas: { pt: 'Comprando roupas em uma loja', es: 'Comprando ropa en una tienda' },
  rp_aeroporto: { pt: 'Resolvendo um problema no aeroporto', es: 'Resolviendo un problema en el aeropuerto' },
  rp_informacao: { pt: 'Pedindo informação na rua', es: 'Pidiendo información en la calle' },
  rp_cultura: { pt: 'Conversando com um estrangeiro sobre cultura brasileira', es: 'Conversando con un extranjero sobre cultura brasileña' },
  rp_reuniao: { pt: 'Participando de uma reunião de trabalho', es: 'Participando en una reunión de trabajo' },
  rp_passeio: { pt: 'Fazendo um passeio com alguém que você acabou de conhecer', es: 'Dando un paseo con alguien que acabas de conocer' },
  // Out of 10
  out_of: { pt: 'de', es: 'de' },
};

// English overrides used when "Switch UI to English" is active in teacher mode.
// Keys mirror the PT translations above. Missing keys fall through to PT.
const enOverrides: Record<string, string> = {
  tutor_virtual: 'Virtual Tutor',
  escolha_modo: 'Choose a learning mode:',
  pergunte_especialista: 'Ask the specialist',
  faca_pergunta: 'Ask the {language} teacher anything',
  pratica_conversacao: 'Conversation practice',
  pratique_conversas: 'Practice conversations in {language}',
  licoes_completas: '📚 Complete Lessons',
  acesse_licoes: 'Access structured lessons with exercises',
  entrevista_emprego: 'Job interview',
  simule_entrevista: 'Simulate a job interview in {language}',
  quiz: 'Quiz',
  teste_conhecimento: 'Test your knowledge',
  jogos: 'Games',
  divirta_se: 'Have fun while practicing {language} with 3 interactive games!',
  pratica_escuta: 'Listening practice',
  melhore_escuta: 'Improve your listening by typing what you hear',
  perguntas: 'Questions',
  responda_perguntas: 'Answer questions and practice conversation',
  simulacao: 'Role-play',
  simule_situacoes: 'Simulate real situations with corrections at the end',
  aulas_particulares: 'Private classes',
  aulas_conversacao_nativos: 'Conversation classes with native speakers',
  mudar_aprendizado: 'Change learning language',
  aprendendo_agora: 'Currently learning: {language}',
  progress: 'Progress',
  total_progress: 'Total progress',
  perguntas_escolha_dificuldade: 'Questions - Choose difficulty',
  dificuldade_facil_desc: 'Simple, direct questions — great for beginners and basic practice.',
  dificuldade_medio_desc: 'Questions for those who already master everyday phrases and essential vocabulary.',
  dificuldade_dificil_desc: 'Challenging questions on advanced topics and situations.',
  voltar: 'Back',
  escolha_o_tema: 'Choose the topic',
  aleatorio: 'Random',
  carregando_temas: 'Loading topics...',
  nenhum_tema_encontrado: 'No topic found.',
  aleatorio_title: 'Pick a random topic',
  dificuldade_invalida: 'Invalid difficulty.',
  erro_carregar_temas: 'Error loading topics.',
  erro_inesperado_temas: 'Unexpected error fetching topics.',
  invalid_difficulty: 'Invalid difficulty or language.',
  fetch_error: 'Error fetching questions.',
  no_questions_found: 'No questions found for this topic.',
  activity_completed: 'Activity completed!',
  you_completed_all_questions: 'You completed all the questions! Great job.',
  continue_lesson: 'Continue lesson',
  try_again: 'Try Again',
  restart_activity: 'Restart activity',
  questions_in_english: 'Questions in English',
  questions_in_spanish: 'Questions in Spanish',
  english_questions: 'English Questions',
  spanish_questions: 'Spanish Questions',
  question_x_of_y: 'Question {questionIndex} of {questionCount}',
  skip: 'Skip',
  write_your_answer_or_use_mic: 'Write your answer here or use the microphone...',
  analyzing_answer: 'Analyzing answer...',
  answer_button: 'Answer',
  teachers_feedback: "Teacher's Feedback",
  what_you_said: 'What you said',
  pause_audio: 'Pause audio',
  listen_to_your_answer: 'Listen to your answer',
  how_native_speaker_says: 'How a native would say it',
  loading: 'Loading...',
  pause_native: 'Pause native',
  listen_to_native: 'Listen to native',
  finish_activity: 'Finish activity',
  next_question: 'Next question',
  feedback_error: "Sorry, I couldn't provide feedback right now. Please try again.",
  licoes_completas_card: 'Complete Lessons',
  pergunte_professor: 'Ask the teacher',
  flashcards_card: 'Flashcards',
  audio_flashcards_card: 'Audio Flashcards',
  curso_completo_card: 'Full Course',
  tradutor_card: 'Translator',
  pnl_card: 'PNL',
  tutorial_card: 'Tutorial',
  criar_licao: 'Create Lesson',
  criar_slideshow: 'Create Slideshow',
  selecione_nivel: 'Select your level',
  licoes_header: 'Lessons',
  clique_selecionar: 'Click to select',
  dificuldade_facil_title: 'Easy',
  dificuldade_facil_description: 'Ideal for beginners. Basic vocabulary and simple structures.',
  dificuldade_medio_title: 'Medium',
  dificuldade_medio_description: 'For those with basic knowledge. Everyday conversations.',
  dificuldade_dificil_title: 'Hard',
  dificuldade_dificil_description: 'Advanced level. Complex texts and in-depth discussions.',
  dificuldade_fluente_title: 'Fluent / Business',
  dificuldade_fluente_description: 'Professional level. Business communication and advanced fluency.',
  carregando_licoes: 'Loading lessons...',
  nenhuma_licao: 'No lesson found',
  nenhuma_licao_desc: 'There are no lessons available for this difficulty at the moment.',
  nenhuma_licao_tipo: 'There are no lessons of this type available.',
  tipo_filtro: 'Type:',
  todos: 'All',
  video_filtro: 'Video',
  audio_filtro: 'Audio',
  texto_filtro: 'Text',
  sair: 'Logout',
  ola: 'Hello',
  play_audio: 'Listen',
  true: 'True',
  false: 'False',
  correct: 'Correct!',
  incorrect: 'Incorrect',
  correct_answer: 'Correct Answer:',
  explanation: 'Explanation:',
  quiz_complete: 'Quiz Complete!',
  you_completed_quiz: 'You completed this quiz!',
  take_quiz_again: 'Take Quiz Again',
  question_x_of_y_quiz: 'Question {questionIndex} of {questionCount}',
  complete_quiz: 'Complete Quiz',
  next_question_quiz: 'Next Question',
  simulacao_title: 'Role-play',
  escolha_dificuldade: 'Choose the difficulty:',
  escolha_situacao: 'Choose the situation:',
  comecar: 'Start',
  pratica_conversacao_title: 'Conversation practice',
  escolha_nivel: 'Choose your level:',
  basico: 'Basic',
  intermediario: 'Intermediate',
  avancado: 'Advanced',
  deseja_correcoes: 'Do you want corrections during the conversation?',
  com_correcao: 'With correction',
  sem_correcao: 'Without correction',
  dica_conversacao: 'Tip: pick one of the suggested topics or type any other subject you want to talk about!',
  comecar_conversa: 'Start conversation',
  entrevista_title: 'Job interview',
  entrevista_desc: "In this mode you'll simulate a job interview with 5 questions specific to your field. At the end you'll get full feedback with English and interview tips.",
  entrevista_recomendado: 'Recommended for intermediate and advanced students.',
  iniciar_entrevista: 'Start Interview',
  escolha_dificuldade_quiz: 'Choose the difficulty:',
  basico_quiz: 'Basic',
  intermediario_avancado: 'Intermediate / Advanced',
  dificuldade_quiz_desc: "Difficulty doesn't change the content of the questions, but the level of vocabulary and complexity of the English text.",
  escolha_tema: 'Choose a topic:',
  dica_quiz: 'Tip: pick one of the suggested topics or type any other subject!',
  outro_tema: 'Other topic',
  digite_tema: 'Type your preferred topic:',
  iniciar_quiz: 'Start Quiz',
  listening_title: 'Listening Practice',
  listening_choose_difficulty: 'Choose the difficulty:',
  como_funciona: 'How it works:',
  listening_step1: 'Click the play button to hear a sentence',
  listening_step2: 'Type / Say exactly what you heard',
  listening_step3: 'Get feedback and your score!',
  jogos_interativos: 'Interactive Games',
  escolha_jogo: 'Choose a game to practice English while having fun:',
  quiz_desc_games: 'Test your knowledge with interactive questions',
  dream_painter_desc: 'Create a painting with the help of AI',
  real_world_hunt_desc: 'Find real objects and take photos',
  licao_do_dia: 'Lesson of the day',
  iniciar_licao: 'Start Lesson',
  nova_conversa: 'New conversation',
  pronuncia: 'Pronunciation',
  pergunte_qualquer: 'Ask anything',
  envie_mensagem: 'Send a message to start the conversation',
  pensando: 'Thinking...',
  mensagem_placeholder: 'Message',
  gravacao_andamento: 'Recording in progress...',
  como_nativo_falaria: 'How a native would say it:',
  sua_transcricao: 'Your transcription:',
  o_que_voce_falou: 'What you said:',
  audio_original: 'Original audio:',
  gramatica_estrutura: 'Grammar and structure',
  analisando: 'Analyzing...',
  perfeito: 'Perfect!',
  erro: 'error',
  erros: 'errors',
  preparando_portugues: 'Preparing Portuguese explanation...',
  traduzindo: 'Translating...',
  explicar_portugues: 'Explain in Portuguese',
  explicacao_portugues: '📝 Portuguese Explanation',
  reproduzir_devagar: 'Play slower',
  avaliando_pronuncia: 'Evaluating pronunciation...',
  pronuncia_label: 'Pronunciation',
  clique_ver: 'Click to see',
  nenhum_erro: '✓ No errors',
  palavras_erro_pronuncia: 'Words with pronunciation errors',
  ativar_ia: 'Activate AI',
  em_breve: 'Coming Soon',
  em_breve_desc: 'This feature is under development and will be available soon.',
  voltar_inicio: 'Back to home',
  correcao_detalhada: 'Detailed Correction',
  seu_texto_original: 'Your original text:',
  texto_corrigido: 'Corrected text:',
  texto_correto: '✅ Your text is correct!',
  sem_erros_corrigir: 'No errors found to correct.',
  correcoes_count: 'Corrections',
  palavra_corrigida: 'This word was corrected in the final version.',
  palavra_adicionada: 'This word was added in the corrected version.',
  faltando: '(missing)',
  duvida_palavra: "I have a doubt about a word",
  outra_duvida: 'I have another doubt',
  rp_restaurante: 'Ordering food at a restaurant',
  rp_hotel: 'Checking in at a hotel',
  rp_conhecendo: 'Meeting someone new',
  rp_roupas: 'Buying clothes at a store',
  rp_aeroporto: 'Solving a problem at the airport',
  rp_informacao: 'Asking for directions on the street',
  rp_cultura: 'Talking with a foreigner about Brazilian culture',
  rp_reuniao: 'Taking part in a work meeting',
  rp_passeio: "Going for a walk with someone you've just met",
  out_of: 'of',
};

// Lesson-specific translations based on learning language
const lessonTranslations: Record<string, Record<LearningLanguage, string>> = {
  // Lesson navigation
  back: { en: 'Back', es: 'Atrás' },
  previous: { en: 'Previous', es: 'Anterior' },
  next: { en: 'Next', es: 'Siguiente' },
  complete: { en: 'Complete', es: 'Completar' },
  completed: { en: 'Completed', es: 'Completado' },
  // Quiz commands
  question: { en: 'Question', es: 'Pregunta' },
  explanation: { en: 'Explanation', es: 'Explicación' },
  correct_answer: { en: 'Correct Answer', es: 'Respuesta Correcta' },
  // True/False quiz - FIXED: These should match what the learning language expects
  true: { en: 'True', es: 'Verdadero' },
  false: { en: 'False', es: 'Falso' },
  // Quiz feedback - FIXED: Corrected the Spanish translations
  correct: { en: 'Correct!', es: '¡Correcto!' },
  incorrect: { en: 'Incorrect', es: 'Incorrecto' },
  // General lesson commands
  play_audio: { en: 'Play Audio', es: 'Reproducir Audio' },
  pause_audio: { en: 'Pause Audio', es: 'Pausar Audio' },
  // Answer and Skip commands
  answer: { en: 'Answer', es: 'Responder' },
  skip: { en: 'Skip', es: 'Saltar' },
  // Progress labels (depend on learning language)
  progress: { en: 'Progress', es: 'Progreso' },
  total_progress: { en: 'Total Progress', es: 'Progreso total' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [uiLanguage, setUiLanguage] = useState<UILanguage>(() => {
    const storedUiLanguage = localStorage.getItem('uiLanguage');
    return (storedUiLanguage as UILanguage) || 'pt';
  });
  const [learningLanguage, setLearningLanguage] = useState<LearningLanguage>(() => {
    const storedLearningLanguage = localStorage.getItem('learningLanguage');
    return (storedLearningLanguage as LearningLanguage) || 'en';
  });
  const [englishUiOverride, setEnglishUiOverride] = useState<boolean>(() => {
    return localStorage.getItem('englishUiOverride') === '1';
  });

  useEffect(() => {
    localStorage.setItem('uiLanguage', uiLanguage);
  }, [uiLanguage]);

  useEffect(() => {
    localStorage.setItem('learningLanguage', learningLanguage);
  }, [learningLanguage]);

  useEffect(() => {
    localStorage.setItem('englishUiOverride', englishUiOverride ? '1' : '0');
  }, [englishUiOverride]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === 'boolean') setEnglishUiOverride(detail);
      else setEnglishUiOverride(prev => !prev);
    };
    window.addEventListener('toggle-english-ui', handler);
    return () => window.removeEventListener('toggle-english-ui', handler);
  }, []);

  const t = (key: string, replacements: Record<string, string> = {}): string => {
    let translation = (englishUiOverride && enOverrides[key]) || translations[key]?.[uiLanguage] || key;
    Object.keys(replacements).forEach(placeholder => {
      translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
    });
    return translation;
  };

  const tLesson = (key: string, replacements: Record<string, string> = {}): string => {
    let translation = lessonTranslations[key]?.[learningLanguage] || key;
    Object.keys(replacements).forEach(placeholder => {
      translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
    });
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ uiLanguage, setUiLanguage, learningLanguage, setLearningLanguage, t, tLesson, language: learningLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
