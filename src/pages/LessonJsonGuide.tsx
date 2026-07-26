import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

const LessonJsonGuide: React.FC = () => {
  return (
    <ScrollArea className="h-screen">
      <div className="max-w-4xl mx-auto px-6 py-10 text-foreground">
        <h1 className="text-4xl font-bold mb-2">📘 Guia Completo: Criando Lições com JSON</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Este guia explica em detalhes como funciona a estrutura JSON das lições, cada tipo de página disponível, como adicionar áudio, imagens, e como usar os botões de geração automática.
        </p>

        {/* ─── STRUCTURE ─── */}
        <Section title="1. Estrutura Geral de uma Lição">
          <p>Cada lição é armazenada no banco de dados com os seguintes campos principais:</p>
          <CodeBlock>{`{
  "id": "minha-licao-01",
  "title": "Título da Lição",
  "description": "Descrição curta que aparece no menu",
  "difficulty": "facil",  // facil | medio | dificil | fluente | pnl
  "content": {
    "pages": [ ... ],          // Array de páginas (o conteúdo principal)
    "credits": { ... },        // Opcional: créditos/narrador
    "flashcards": [ ... ],     // Opcional: flashcards da lição
    "complementaryLessonIds": [ ... ]  // Opcional: IDs de lições complementares
  }
}`}</CodeBlock>
          <p className="mt-3">
            O campo <Code>content</Code> é o coração da lição. Ele contém um array <Code>pages</Code> onde cada elemento é uma página com um <Code>type</Code> específico.
          </p>
        </Section>

        {/* ─── DESTINATIONS ─── */}
        <Section title="2. Destinos de Salvamento">
          <p>Ao criar uma lição, você escolhe onde ela será salva:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Lessons (Lições Principais)</strong> — Tabela <Code>lessons</Code>. Organizadas por dificuldade (fácil, médio, difícil, fluente, PNL).</li>
            <li><strong>Content (Conteúdo Complementar)</strong> — Tabela <Code>content_items</Code>. Organizadas por Categoria → Capítulo.</li>
            <li><strong>TOEFL</strong> — Tabela <Code>toefl_items</Code>. Organizadas por Categoria TOEFL → Capítulo.</li>
          </ul>
        </Section>

        {/* ─── PAGE TYPES ─── */}
        <Section title="3. Tipos de Página Disponíveis">
          <p className="mb-4">Cada página no array <Code>pages</Code> tem um campo <Code>type</Code> que define seu comportamento. Abaixo, todos os tipos:</p>

          {/* CONTENT */}
          <SubSection title='3.1 — "content" (Página de Conteúdo com Imagem e Áudio)'>
            <p>Página simples com uma imagem e um áudio. Ideal para introduções visuais com narração.</p>
            <CodeBlock>{`{
  "type": "content",
  "title": "Welcome",
  "imageUrl": "https://example.com/cover.jpg",
  "audioUrl": ""  // Deixe vazio para gerar depois
}`}</CodeBlock>
            <Tip>Funciona como uma "capa" ou slide de apresentação com imagem e áudio de fundo.</Tip>
          </SubSection>

          {/* VIDEO */}
          <SubSection title='3.2 — "video" (Página de Vídeo)'>
            <p>Exibe um player de vídeo (YouTube, Vimeo, ou URL direta).</p>
            <CodeBlock>{`{
  "type": "video",
  "title": "Assista ao vídeo",
  "videoUrl": "https://www.youtube.com/watch?v=XXXX"
}`}</CodeBlock>
          </SubSection>

          {/* ARTICLE */}
          <SubSection title='3.3 — "article" (Artigo / Texto)'>
            <p>Exibe um texto longo com título e imagem opcional. Suporta modo "slide" para exibir o texto em trechos menores.</p>
            <CodeBlock>{`{
  "type": "article",
  "title": "Reading Practice",
  "text": "The full article text goes here...",
  "imageUrl": "https://example.com/image.jpg",  // opcional
  "slideMode": false  // opcional — se true, exibe o texto em slides (trecho por trecho)
}`}</CodeBlock>
            <Tip>Ative <Code>slideMode: true</Code> para textos longos — o aluno avança trecho por trecho em vez de ver tudo de uma vez.</Tip>
          </SubSection>

          {/* TTS ARTICLE */}
          <SubSection title='3.4 — "ttsArticle" (Artigo com Áudio TTS)'>
            <p>Igual ao artigo, mas com texto para leitura e texto separado para gerar áudio via Text-to-Speech.</p>
            <CodeBlock>{`{
  "type": "ttsArticle",
  "title": "Listen and Read",
  "imageUrl": "https://example.com/image.jpg",
  "displayText": "Texto visível para o aluno ler...",
  "audioText": "Texto que será convertido em áudio (pode ser diferente do displayText)",
  "audioUrl": ""  // Deixe vazio — será preenchido ao gerar áudio
}`}</CodeBlock>
            <Tip>O campo <Code>audioUrl</Code> começa vazio. Use o botão <strong>"Gerar Áudio"</strong> no editor para gerar automaticamente via ElevenLabs TTS. O sistema preenche o campo com a URL do áudio gerado.</Tip>
          </SubSection>

          {/* MULTIPLE CHOICE */}
          <SubSection title='3.5 — "multipleChoice" (Múltipla Escolha)'>
            <p>Pergunta com opções e uma resposta correta.</p>
            <CodeBlock>{`{
  "type": "multipleChoice",
  "title": "Quiz",
  "question": "What does 'however' mean?",
  "imageUrl": "https://...",  // opcional
  "options": ["But", "Because", "And", "So"],
  "correctAnswer": 0,  // Índice da resposta correta (começa em 0)
  "explanation": "However means 'but' or 'nevertheless'."  // opcional
}`}</CodeBlock>
          </SubSection>

          {/* MULTIPLE CHOICE WITH TEXT */}
          <SubSection title='3.6 — "multipleChoiceWithText" (Múltipla Escolha com Texto)'>
            <p>Um texto de referência seguido de várias perguntas de múltipla escolha.</p>
            <CodeBlock>{`{
  "type": "multipleChoiceWithText",
  "title": "Reading Comprehension",
  "text": "Read this passage carefully...",
  "questions": [
    {
      "id": "q1",
      "question": "What is the main idea?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 1,
      "explanation": "The answer is B because..."
    },
    {
      "id": "q2",
      "question": "Second question...",
      "options": ["A", "B", "C"],
      "correctAnswer": 0
    }
  ]
}`}</CodeBlock>
          </SubSection>

          {/* AUDIO MULTIPLE CHOICE */}
          <SubSection title='3.7 — "audioMultipleChoice" (Múltipla Escolha com Áudio)'>
            <p>O aluno ouve um áudio e responde uma pergunta de múltipla escolha.</p>
            <CodeBlock>{`{
  "type": "audioMultipleChoice",
  "title": "Listening Quiz",
  "question": "What did the speaker say?",
  "audioUrl": "",  // Deixe vazio para gerar depois
  "options": ["He went to the park", "He stayed home", "He went shopping"],
  "correctAnswer": 0,
  "explanation": "The speaker said he went to the park."
}`}</CodeBlock>
            <Tip>Use o botão <strong>"Gerar Áudio"</strong> para criar o áudio a partir de um texto que você definir.</Tip>
          </SubSection>

          {/* TRUE/FALSE */}
          <SubSection title='3.8 — "trueFalse" (Verdadeiro ou Falso Simples)'>
            <p>Afirmações isoladas que o aluno marca como verdadeiras ou falsas. Pode ter uma única afirmação ou um array de várias.</p>
            <CodeBlock>{`// Formato com array de questions (recomendado):
{
  "type": "trueFalse",
  "title": "True or False",
  "questions": [
    {
      "text": "The sun rises in the west.",
      "correctAnswer": false,
      "explanation": "The sun rises in the east."
    },
    {
      "text": "Water boils at 100°C at sea level.",
      "correctAnswer": true,
      "explanation": "This is correct at standard atmospheric pressure."
    }
  ]
}

// Formato legado com statement único:
{
  "type": "trueFalse",
  "title": "True or False",
  "statement": "The Earth is flat.",
  "isTrue": false,
  "explanation": "The Earth is roughly spherical."
}`}</CodeBlock>
            <Tip>Prefira o formato com <Code>questions</Code> array para poder ter múltiplas afirmações numa só página.</Tip>
          </SubSection>

          {/* TRUE/FALSE WITH TEXT */}
          <SubSection title='3.9 — "trueFalseWithText" (Verdadeiro ou Falso com Texto)'>
            <p>Um texto de referência seguido de afirmações que o aluno marca como verdadeiras ou falsas.</p>
            <CodeBlock>{`{
  "type": "trueFalseWithText",
  "title": "True or False",
  "text": "Read the following text...",
  "questions": [
    {
      "id": "tf1",
      "question": "The author lives in New York.",
      "answer": true,
      "explanation": "The text mentions he lives in NYC."
    },
    {
      "id": "tf2",
      "question": "He has two children.",
      "answer": false,
      "explanation": "He has three children."
    }
  ]
}`}</CodeBlock>
          </SubSection>

          {/* EXACT ANSWER */}
          <SubSection title='3.10 — "exactAnswer" (Resposta Exata)'>
            <p>O aluno digita a resposta e o sistema confere se corresponde a uma das respostas aceitas.</p>
            <CodeBlock>{`{
  "type": "exactAnswer",
  "title": "Fill in the blank",
  "question": "Complete: I ___ to the store yesterday.",
  "imageUrl": "https://...",  // opcional
  "correctAnswers": ["went", "Went"],  // Múltiplas variações aceitas
  "explanation": "The past tense of 'go' is 'went'."
}`}</CodeBlock>
          </SubSection>

          {/* MATCHING */}
          <SubSection title='3.11 — "matching" (Correspondência)'>
            <p>O aluno faz pares entre colunas (ex: palavra ↔ tradução).</p>
            <CodeBlock>{`{
  "type": "matching",
  "title": "Match the words",
  "instructions": "Match each word with its translation.",  // opcional
  "pairs": [
    { "left": "Dog", "right": "Cachorro" },
    { "left": "Cat", "right": "Gato" },
    { "left": "Bird", "right": "Pássaro" }
  ]
}`}</CodeBlock>
          </SubSection>

          {/* ESSAY */}
          <SubSection title='3.12 — "essay" (Redação)'>
            <p>O aluno escreve um texto sobre um tema proposto.</p>
            <CodeBlock>{`{
  "type": "essay",
  "title": "Writing Practice",
  "topic": "Describe your favorite vacation.",
  "instructions": "Write at least 100 words."  // opcional
}`}</CodeBlock>
          </SubSection>

          {/* AI FEEDBACK */}
          <SubSection title='3.13 — "aiFeedback" (Feedback por IA)'>
            <p>Exibe perguntas que o aluno responde por texto, e a IA dá feedback personalizado.</p>
            <CodeBlock>{`{
  "type": "aiFeedback",
  "title": "AI Practice",
  "topic": "Describe your daily routine",
  "questions": [
    "What time do you wake up?",
    "What do you usually eat for breakfast?"
  ]
}`}</CodeBlock>
          </SubSection>

          {/* AI FEEDBACK WITH PARAMETERS */}
          <SubSection title='3.14 — "aiFeedbackWithParameters" (Feedback IA com Parâmetros)'>
            <p>Como o aiFeedback, mas com critérios de avaliação definidos (ex: gramática, vocabulário).</p>
            <CodeBlock>{`{
  "type": "aiFeedbackWithParameters",
  "title": "Speaking Evaluation",
  "topic": "Talk about your hobbies",
  "questions": [
    "What are your main hobbies?",
    "Why do you enjoy them?"
  ],
  "evaluationParameters": [
    "Grammar accuracy",
    "Vocabulary range",
    "Coherence"
  ]
}`}</CodeBlock>
          </SubSection>

          {/* AI FEEDBACK WITH PARAMETERS ESSAY */}
          <SubSection title='3.15 — "aiFeedbackWithParametersEssay" (Feedback IA Essay)'>
            <p>Igual ao anterior, mas formatado como redação em vez de respostas curtas.</p>
            <CodeBlock>{`{
  "type": "aiFeedbackWithParametersEssay",
  "title": "Essay Evaluation",
  "topic": "The importance of education",
  "questions": [
    "Write an essay about why education matters."
  ],
  "evaluationParameters": [
    "Thesis statement",
    "Supporting arguments",
    "Grammar",
    "Conclusion"
  ]
}`}</CodeBlock>
          </SubSection>

          {/* RECOMMENDED VOCABULARY */}
          <SubSection title='3.16 — "recommendedVocabulary" (Vocabulário Recomendado)'>
            <p>Mostra perguntas de discussão e sugere palavras úteis para responder.</p>
            <CodeBlock>{`{
  "type": "recommendedVocabulary",
  "title": "Vocabulary for Discussion",
  "topic": "Travel",
  "questions": [
    "Where would you like to travel?",
    "What's the best trip you've ever taken?"
  ],
  "recommendedWords": [
    "destination", "itinerary", "abroad", "sightseeing", "luggage"
  ]
}`}</CodeBlock>
          </SubSection>

          {/* SUGGESTED WORDS */}
          <SubSection title='3.17 — "suggestedWords" (Palavras Sugeridas)'>
            <p>Lista de palavras sugeridas para o aluno praticar (pode ser usada com flashcards).</p>
            <CodeBlock>{`{
  "type": "suggestedWords",
  "title": "Words to Practice",
  "description": "Learn these words before the next lesson.",
  "suggestedWords": ["accomplish", "determine", "significant", "pursue"]
}`}</CodeBlock>
          </SubSection>

          {/* LISTENING (TRANSCRIPTION) */}
          <SubSection title='3.18 — "listening" (Transcrição de Áudio)'>
            <p>O aluno ouve um áudio gerado automaticamente e deve transcrever o que ouviu. A IA compara a transcrição com o texto original e dá feedback.</p>
            <CodeBlock>{`{
  "type": "listening",
  "title": "Listening Transcription",
  "questions": [
    { "originalText": "I would like a cup of coffee, please." },
    { "originalText": "Can you tell me where the nearest station is?" },
    { "originalText": "She has been working here for five years." }
  ],
  "audioUrl": ""  // opcional — áudio pré-gravado. Se vazio, o sistema gera TTS automaticamente.
}`}</CodeBlock>
            <Tip>Cada <Code>originalText</Code> é uma frase que será convertida em áudio. O aluno ouve e tenta transcrever exatamente. Ótimo para treinar listening comprehension.</Tip>
          </SubSection>

          {/* LISTENING VIDEO */}
          <SubSection title='3.19 — "listeningVideo" (Transcrição com Vídeo)'>
            <p>Similar ao listening, mas com um vídeo de referência. O aluno assiste ao vídeo e transcreve frases específicas.</p>
            <CodeBlock>{`{
  "type": "listeningVideo",
  "title": "Video Listening",
  "videoUrl": "https://www.youtube.com/watch?v=XXXX",
  "questions": [
    { "originalText": "Welcome to our channel." },
    { "originalText": "Today we're going to talk about travel tips." }
  ]
}`}</CodeBlock>
            <Tip>Diferente do <Code>videoQuiz</Code>, aqui o aluno transcreve o que ouve em vez de responder múltipla escolha.</Tip>
          </SubSection>

          {/* TRANSLATION */}
          <SubSection title='3.20 — "translation" (Tradução)'>
            <p>O aluno recebe frases em português e deve traduzir para inglês. A IA avalia a tradução e dá feedback detalhado.</p>
            <CodeBlock>{`{
  "type": "translation",
  "title": "Translation Practice",
  "questions": [
    {
      "original": "Eu gosto de estudar inglês.",
      "correctTranslation": "I like to study English."
    },
    {
      "original": "Ela trabalha em um hospital.",
      "correctTranslation": "She works at a hospital."
    },
    {
      "original": "Nós vamos viajar amanhã.",
      "correctTranslation": "We are going to travel tomorrow."
    }
  ]
}`}</CodeBlock>
            <Tip>A IA aceita traduções alternativas válidas, não apenas a tradução exata fornecida. O feedback inclui sugestões de melhoria.</Tip>
          </SubSection>

          {/* SLIDESHOW */}
          <SubSection title='3.21 — "slideshow" (Apresentação de Slides)'>
            <p>Exibe uma apresentação de slides previamente criada no Slideshow Creator.</p>
            <CodeBlock>{`{
  "type": "slideshow",
  "title": "Grammar Review",
  "slideshowId": "uuid-do-slideshow"  // ID da tabela 'slideshows'
}`}</CodeBlock>
            <Tip>Crie a apresentação primeiro em <Code>/slideshow-creator</Code>, copie o ID e cole aqui.</Tip>
          </SubSection>

          {/* PDF */}
          <SubSection title='3.22 — "pdf" (Documento PDF)'>
            <p>Exibe um PDF embutido para o aluno ler. Inclui controles de zoom, navegação por páginas e rotação.</p>
            <CodeBlock>{`{
  "type": "pdf",
  "title": "Grammar Rules",  // opcional
  "pdfUrl": "https://example.com/document.pdf"
}`}</CodeBlock>
          </SubSection>

          {/* VIDEO QUIZ */}
          <SubSection title='3.23 — "videoQuiz" (Vídeo com Quiz Interativo)'>
            <p>Um vídeo que pausa em momentos específicos para fazer perguntas ao aluno.</p>
            <CodeBlock>{`{
  "type": "videoQuiz",
  "title": "Interactive Video",
  "videoUrl": "https://www.youtube.com/watch?v=XXXX",
  "questions": [
    {
      "id": "vq1",
      "timestamp_seconds": 30,
      "question": "What did the speaker mention about London?",
      "correct_answers": ["Big Ben", "big ben"],
      "visible": true
    },
    {
      "id": "vq2",
      "timestamp_seconds": 90,
      "question": "What year was mentioned?",
      "correct_answers": ["2020"],
      "visible": true
    }
  ]
}`}</CodeBlock>
            <Tip>O campo <Code>timestamp_seconds</Code> define em qual segundo do vídeo a pergunta aparece. <Code>visible: false</Code> esconde a pergunta temporariamente.</Tip>
          </SubSection>

          {/* CUSTOM PRONUNCIATION SLIDES */}
          <SubSection title='3.24 — "customPronunciationSlides" (Slides de Pronúncia Customizados)'>
            <p>Slides onde o aluno pratica pronúncia comparando sua fala com o texto.</p>
            <CodeBlock>{`{
  "type": "customPronunciationSlides",
  "title": "Pronunciation Practice",
  "slides": [
    {
      "displayText": "I would like to order a coffee, please.",
      "comparisonText": "I would like to order a coffee, please.",
      "translation": "Eu gostaria de pedir um café, por favor.",
      "audioMode": false,
      "displayAudioUrl": ""  // Pode ser preenchido com geração de áudio
    },
    {
      "displayText": "Could you repeat that?",
      "comparisonText": "Could you repeat that?",
      "translation": "Você poderia repetir isso?"
    }
  ]
}`}</CodeBlock>
            <Tip>Se <Code>audioMode</Code> for <Code>true</Code>, o aluno ouve o áudio em vez de ver o texto primeiro. Use o botão de geração para criar <Code>displayAudioUrl</Code>.</Tip>
          </SubSection>

          {/* AUDIO SLIDES */}
          <SubSection title='3.25 — "audioSlides" (Slides com Áudio)'>
            <p>Slides com texto em inglês, tradução e áudio para cada slide.</p>
            <CodeBlock>{`{
  "type": "audioSlides",
  "title": "Vocabulary with Audio",
  "slides": [
    {
      "english": "Good morning!",
      "translation": "Bom dia!",
      "audioUrl": ""  // Gerar depois
    },
    {
      "english": "How are you?",
      "translation": "Como você está?",
      "audioUrl": ""
    }
  ]
}`}</CodeBlock>
            <Tip>Use o botão <strong>"Gerar Todos os Áudios"</strong> para gerar áudio para todos os slides de uma vez.</Tip>
          </SubSection>

          {/* PNL SLIDES */}
          <SubSection title='3.26 — "pnlSlides" (Slides PNL)'>
            <p>Referencia slides de uma lição PNL pré-cadastrada no sistema.</p>
            <CodeBlock>{`{
  "type": "pnlSlides",
  "title": "Verbs - Food and Drinks",
  "lessonId": "food-and-drinks",
  "category": "verbs"  // verbs | newWords | usefulPhrases | grammarExamples
}`}</CodeBlock>
          </SubSection>

          {/* PRONUNCIATION SLIDES */}
          <SubSection title='3.27 — "pronunciationSlides" (Slides de Pronúncia PNL)'>
            <p>Igual aos PNL Slides, mas com funcionalidade de comparação de pronúncia.</p>
            <CodeBlock>{`{
  "type": "pronunciationSlides",
  "title": "Pronunciation - New Words",
  "lessonId": "food-and-drinks",
  "category": "newWords"
}`}</CodeBlock>
          </SubSection>

          {/* TOEFL SCORE */}
          <SubSection title='3.28 — "toeflScore" (Página de Pontuação TOEFL)'>
            <p>Exibe a pontuação final do aluno em exercícios TOEFL. Mostra acertos, erros e porcentagem.</p>
            <CodeBlock>{`{
  "type": "toeflScore",
  "title": "Your TOEFL Score",
  "totalQuestions": 10  // Total de perguntas nas páginas anteriores
}`}</CodeBlock>
            <Tip>Coloque esta página como última da lição. O sistema conta automaticamente acertos e erros das páginas de múltipla escolha anteriores.</Tip>
          </SubSection>
        </Section>

        {/* ─── CREDITS ─── */}
        <Section title="4. Créditos e Narrador">
          <p>Você pode adicionar créditos no final da lição, mostrando quem narrou:</p>
          <CodeBlock>{`"credits": {
  "enabled": true,
  "narrator": "Lucas"  // Nome do voice artist (ex: Lucas, Maria, Sarah)
}`}</CodeBlock>
          <p className="mt-2">Os narradores disponíveis estão definidos em <Code>voiceArtists.ts</Code> e aparecem automaticamente na tela de créditos com foto e bandeira.</p>
        </Section>

        {/* ─── FLASHCARDS ─── */}
        <Section title="5. Flashcards da Lição">
          <p>Flashcards que o aluno pode adquirir ao completar a lição:</p>
          <CodeBlock>{`"flashcards": [
  {
    "front": "accomplish",
    "back": "realizar, alcançar",
    "context": "She accomplished her goals."  // opcional
  },
  {
    "front": "determine",
    "back": "determinar, decidir"
  }
]`}</CodeBlock>
          <p className="mt-2">Quando o aluno termina a lição, um modal aparece oferecendo os flashcards para adicionar à coleção pessoal.</p>
        </Section>

        {/* ─── COMPLEMENTARY LESSONS ─── */}
        <Section title="6. Lições Complementares">
          <p>Você pode vincular lições complementares que aparecem no final:</p>
          <CodeBlock>{`"complementaryLessonIds": [
  "uuid-da-licao-complementar-1",
  "uuid-da-licao-complementar-2"
]`}</CodeBlock>
          <p className="mt-2">O sistema busca automaticamente o título e dificuldade dessas lições e exibe botões para o aluno navegar até elas.</p>
        </Section>

        {/* ─── AUDIO GENERATION ─── */}
        <Section title="7. Geração de Áudio (Botões de Geração)">
          <p>Vários tipos de página têm campos <Code>audioUrl</Code> que começam vazios. O editor tem botões para gerar áudio automaticamente:</p>
          <ul className="list-disc pl-6 space-y-3 mt-3">
            <li>
              <strong>🔊 Gerar Áudio (individual)</strong> — Gera áudio para um slide ou campo específico. Usa o texto do campo <Code>audioText</Code>, <Code>english</Code>, ou <Code>displayText</Code> dependendo do tipo.
            </li>
            <li>
              <strong>🔊 Gerar Todos os Áudios</strong> — Para páginas com múltiplos slides (audioSlides, customPronunciationSlides), gera áudio para todos de uma vez.
            </li>
            <li>
              <strong>Como funciona:</strong> O sistema envia o texto para a edge function <Code>speak-elevenlabs</Code> que usa a API ElevenLabs para gerar áudio com voz natural. O áudio é salvo no Supabase Storage e a URL é preenchida automaticamente no campo.
            </li>
          </ul>
          <Tip>Após gerar, o áudio fica salvo permanentemente. Você pode re-gerar clicando novamente — o novo áudio substitui o anterior.</Tip>
        </Section>

        {/* ─── IMAGE GENERATION ─── */}
        <Section title="8. Geração de Imagens">
          <p>Alguns tipos de página aceitam <Code>imageUrl</Code>. No editor, você pode:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>🖼️ Upload direto</strong> — Fazer upload de uma imagem do seu computador.</li>
            <li><strong>✨ Gerar com IA</strong> — Descrever a imagem desejada e a IA gera automaticamente. A imagem é salva no Supabase Storage.</li>
            <li><strong>🔗 URL externa</strong> — Colar diretamente uma URL de imagem.</li>
          </ul>
        </Section>

        {/* ─── CACHED AUDIO ─── */}
        <Section title="9. Cache de Áudio (cached_audio_urls)">
          <p>O campo <Code>cached_audio_urls</Code> na tabela da lição armazena URLs de áudio pré-gerados para páginas TTS. Isso evita re-gerar áudio toda vez que a lição é carregada.</p>
          <CodeBlock>{`"cached_audio_urls": {
  "page_0": "https://storage.supabase.co/.../audio1.mp3",
  "page_2": "https://storage.supabase.co/.../audio2.mp3"
}`}</CodeBlock>
          <p className="mt-2">O sistema gerencia isso automaticamente — você não precisa editar manualmente.</p>
        </Section>

        {/* ─── KOE FLASHCARD WORDS ─── */}
        <Section title="10. KOE Flashcard Words">
          <p>O campo <Code>koe_flashcard_words</Code> armazena palavras-chave da lição para o sistema de flashcards KOE:</p>
          <CodeBlock>{`"koe_flashcard_words": [
  "accomplish", "determine", "significant", "pursue", "achieve"
]`}</CodeBlock>
          <p className="mt-2">Essas palavras são usadas para gerar flashcards automáticos com áudio para os alunos praticarem.</p>
        </Section>

        {/* ─── FULL EXAMPLE ─── */}
        <Section title="11. Exemplo Completo de uma Lição">
          <CodeBlock>{`{
  "id": "travel-vocabulary-01",
  "title": "Travel Vocabulary",
  "description": "Learn essential words for traveling abroad",
  "difficulty": "facil",
  "content": {
    "pages": [
      {
        "type": "ttsArticle",
        "title": "Read and Listen",
        "imageUrl": "https://example.com/travel.jpg",
        "displayText": "Traveling can be an enriching experience...",
        "audioText": "Traveling can be an enriching experience...",
        "audioUrl": ""
      },
      {
        "type": "multipleChoice",
        "title": "Comprehension Check",
        "question": "What does 'enriching' mean in this context?",
        "options": ["Rewarding", "Expensive", "Tiring", "Quick"],
        "correctAnswer": 0,
        "explanation": "'Enriching' means something that adds value or knowledge."
      },
      {
        "type": "matching",
        "title": "Match the Words",
        "pairs": [
          { "left": "Boarding pass", "right": "Cartão de embarque" },
          { "left": "Luggage", "right": "Bagagem" },
          { "left": "Customs", "right": "Alfândega" }
        ]
      },
      {
        "type": "customPronunciationSlides",
        "title": "Practice Saying These Phrases",
        "slides": [
          {
            "displayText": "Excuse me, where is the boarding gate?",
            "comparisonText": "Excuse me, where is the boarding gate?",
            "translation": "Com licença, onde é o portão de embarque?"
          }
        ]
      },
      {
        "type": "aiFeedbackWithParameters",
        "title": "Speaking Practice",
        "topic": "Travel experiences",
        "questions": [
          "Describe your last trip.",
          "What do you always pack when traveling?"
        ],
        "evaluationParameters": ["Grammar", "Vocabulary", "Fluency"]
      }
    ],
    "credits": {
      "enabled": true,
      "narrator": "Lucas"
    },
    "flashcards": [
      { "front": "boarding pass", "back": "cartão de embarque" },
      { "front": "luggage", "back": "bagagem" },
      { "front": "customs", "back": "alfândega" }
    ],
    "complementaryLessonIds": []
  }
}`}</CodeBlock>
        </Section>

        {/* ─── TIPS ─── */}
        <Section title="12. Dicas e Boas Práticas">
          <ul className="list-disc pl-6 space-y-3">
            <li><strong>Comece simples:</strong> Use o Lesson Creator visual (<Code>/lesson-creator</Code>) para criar a estrutura, depois exporte o JSON para ajustar manualmente se necessário.</li>
            <li><strong>IDs únicos:</strong> Cada <Code>id</Code> dentro de questions deve ser único (ex: <Code>q1</Code>, <Code>q2</Code>, <Code>tf1</Code>, <Code>tf2</Code>).</li>
            <li><strong>Ordem das páginas:</strong> As páginas são exibidas na ordem do array. Organize da introdução → prática → avaliação.</li>
            <li><strong>Dificuldade:</strong> Use <Code>facil</Code>, <Code>medio</Code>, <Code>dificil</Code>, <Code>fluente</Code> ou <Code>pnl</Code> para categorizar.</li>
            <li><strong>Áudio vazio:</strong> Sempre deixe <Code>audioUrl: ""</Code> se pretende gerar depois. Nunca omita o campo.</li>
            <li><strong>Imagens:</strong> Prefira URLs do Supabase Storage para confiabilidade. Imagens externas podem quebrar.</li>
            <li><strong>Teste antes de publicar:</strong> Use o botão de Preview no editor para ver como a lição ficará para o aluno.</li>
            <li><strong>Flashcards:</strong> Se a lição ensina vocabulário novo, sempre adicione flashcards para reforço.</li>
            <li><strong>Complementares:</strong> Vincule lições relacionadas para criar trilhas de aprendizado.</li>
          </ul>
        </Section>

        {/* ─── EDITOR BUTTONS ─── */}
        <Section title="13. Botões do Editor e suas Funções">
          <div className="space-y-3">
            <EditorButton icon="🎵" name="Gerar Áudio" desc="Gera áudio TTS para o campo selecionado usando ElevenLabs." />
            <EditorButton icon="🎵✨" name="Gerar Todos os Áudios" desc="Gera áudio para todos os slides de uma página de uma vez." />
            <EditorButton icon="🖼️" name="Gerar Imagem" desc="Gera uma imagem com IA a partir de uma descrição textual." />
            <EditorButton icon="📎" name="Upload" desc="Faz upload de arquivo (imagem ou áudio) para o Supabase Storage." />
            <EditorButton icon="👁️" name="Preview" desc="Mostra como a página ficará para o aluno." />
            <EditorButton icon="📋" name="JSON" desc="Mostra o JSON bruto da lição para copiar/colar." />
            <EditorButton icon="💾" name="Salvar" desc="Salva a lição no banco de dados (cria ou atualiza)." />
            <EditorButton icon="🗑️" name="Excluir Página" desc="Remove uma página da lição (não pode desfazer)." />
            <EditorButton icon="↕️" name="Reordenar" desc="Arraste as páginas para mudar a ordem (drag and drop)." />
            <EditorButton icon="🔗" name="Otimizar Imagem" desc="Comprime a imagem para reduzir tamanho e melhorar carregamento." />
          </div>
        </Section>

        <div className="h-20" />
      </div>
    </ScrollArea>
  );
};

/* ─── Reusable sub-components ─── */

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="text-2xl font-bold mb-3 text-primary">{title}</h2>
    <div className="text-base leading-relaxed text-foreground/90">{children}</div>
  </section>
);

const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6 pl-4 border-l-4 border-primary/30">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <div className="text-sm leading-relaxed">{children}</div>
  </div>
);

const CodeBlock: React.FC<{ children: string }> = ({ children }) => (
  <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm mt-2 mb-2 border border-border">
    <code className="text-foreground/80">{children}</code>
  </pre>
);

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">{children}</code>
);

const Tip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-2 text-sm">
    <span className="font-semibold">💡 Dica:</span> {children}
  </div>
);

const EditorButton: React.FC<{ icon: string; name: string; desc: string }> = ({ icon, name, desc }) => (
  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-border">
    <span className="text-xl">{icon}</span>
    <div>
      <span className="font-semibold">{name}</span>
      <span className="text-muted-foreground"> — {desc}</span>
    </div>
  </div>
);

export default LessonJsonGuide;
