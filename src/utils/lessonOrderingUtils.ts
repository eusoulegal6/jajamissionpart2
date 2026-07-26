
import { Lesson } from "@/types/lesson";

// Define custom ordering for each difficulty level
const LESSON_ORDER_CONFIG = {
  "Fácil": [
    // Foundation: Personal basics and greetings
    "Personal Introductions",
    "Greetings and Salutations",
    
    // Core vocabulary: Numbers, time, colors
    "Numbers and Counting",
    "Days of the Week", 
    "Months and Seasons",
    "Time and Schedules",
    "Basic Colors",
    
    // Personal and family
    "Family",
    "Physical Descriptions",
    "Body Parts",
    "Feelings and Emotions",
    
    // Essential daily vocabulary
    "Clothing and Accessories",
    "Food and Drinks",
    "House and Furniture",
    
    // Animals and nature
    "Domestic Animals",
    "Weather and Climate",
    
    // Social and professional contexts
    "Professions",
    "School and Education",
    
    // Daily activities and routines
    "Daily Routine",
    "Transportation",
    "Basic Shopping",
    "At the Supermarket",
    
    // Health and wellness
    "Health and Wellness",
    
    // Communication and help
    "Asking for Help",
    "Basic Emergencies",
    
    // Cultural and leisure topics
    "Popular Sports",
    "Music and Instruments",
    "Leisure and Fun",
    
    // Technology and geography
    "Basic Technology",
    "Countries and Nationalities",
    
    // Grammar fundamentals
    "Have / Has"
  ],
  "Médio": [
    "Conversas no Trabalho",
    "Fazendo Compras",
    "No Restaurante",
    "Pedindo Direções",
    "Falando sobre Hobbies",
    "Planos para o Fim de Semana",
    "No Médico",
    "Viagens e Turismo"
  ],
  "Difícil": [
    "Negociações Comerciais",
    "Apresentações Formais",
    "Entrevistas de Emprego",
    "Debates e Discussões",
    "Análise de Problemas",
    "Planejamento Estratégico",
    "Liderança e Gestão",
    "Comunicação Intercultural"
  ],
  "Fluente": [
    "Executive Communication",
    "Advanced Negotiations",
    "Strategic Planning Sessions",
    "Board Room Presentations",
    "International Business Etiquette",
    "Complex Problem Solving",
    "Leadership in Global Teams",
    "Financial Reporting and Analysis",
    "Mergers and Acquisitions",
    "Corporate Social Responsibility",
    "Innovation and Digital Transformation",
    "Crisis Management Communication"
  ],
  "PNL": [
    "Introdução à PNL",
    "Rapport e Conexão",
    "Linguagem Corporal",
    "Padrões de Linguagem",
    "Ancoragem",
    "Metamodelo",
    "Ressignificação",
    "Estados de Excelência"
  ]
};

/**
 * Orders lessons based on custom configuration with fallback mechanisms
 */
export const orderLessons = (
  lessons: Lesson[], 
  difficulty: "Fácil" | "Médio" | "Difícil" | "PNL" | "Fluente"
): Lesson[] => {
  console.log(`Ordering ${lessons.length} lessons for difficulty: ${difficulty}`);
  
  if (!lessons || lessons.length === 0) {
    console.log("No lessons to order");
    return [];
  }

  try {
    // Get the custom order for this difficulty
    const customOrder = LESSON_ORDER_CONFIG[difficulty] || [];
    console.log(`Custom order defined for ${customOrder.length} lessons`);

    if (customOrder.length === 0) {
      console.log("No custom order defined, using alphabetical fallback");
      return sortAlphabetically([...lessons]);
    }

    // Create ordered and unordered lesson arrays
    const orderedLessons: Lesson[] = [];
    const unorderedLessons: Lesson[] = [...lessons];

    // First, place lessons according to custom order
    customOrder.forEach(title => {
      const lessonIndex = unorderedLessons.findIndex(lesson => 
        lesson.title.toLowerCase().trim() === title.toLowerCase().trim()
      );
      
      if (lessonIndex !== -1) {
        const [lesson] = unorderedLessons.splice(lessonIndex, 1);
        orderedLessons.push(lesson);
        console.log(`Ordered lesson: ${lesson.title}`);
      } else {
        console.log(`Lesson not found for custom order: ${title}`);
      }
    });

    // Add any remaining lessons (not in custom order) at the end, sorted alphabetically
    if (unorderedLessons.length > 0) {
      console.log(`Adding ${unorderedLessons.length} remaining lessons in alphabetical order`);
      const sortedRemaining = sortAlphabetically(unorderedLessons);
      orderedLessons.push(...sortedRemaining);
    }

    console.log(`Final ordered lessons count: ${orderedLessons.length}`);
    return orderedLessons;

  } catch (error) {
    console.error("Error ordering lessons, falling back to alphabetical order:", error);
    return sortAlphabetically([...lessons]);
  }
};

/**
 * Sorts lessons alphabetically by title
 */
const sortAlphabetically = (lessons: Lesson[]): Lesson[] => {
  return [...lessons].sort((a, b) => a.title.localeCompare(b.title));
};
