
import { LearningLanguage } from "@/contexts/LanguageContext";

/**
 * Roleplay intro message generator.
 * Provides initial messages for role-play scenarios in either English or Spanish.
 */
export function getRoleplayIntroMessage(situation: string, learningLanguage: LearningLanguage = 'en'): string {
  if (learningLanguage === 'es') {
    switch (situation) {
      case "Pedindo comida em um restaurante":
        return `🟡 Contexto de la situación:
Estás en un restaurante y quieres pedir tu comida.

🔵 Camarero: ¡Buenas noches! Bienvenido a nuestro restaurante. ¿Ha tenido la oportunidad de ver el menú?`;
      case "Fazendo check-in em um hotel":
        return `🟡 Contexto de la situación:
Has llegado al hotel después de un largo viaje y necesitas hacer el check-in.

🔵 Recepcionista: ¡Buenas tardes! Bienvenido al Gran Hotel. ¿En qué puedo ayudarle hoy?`;
      case "Conhecendo alguém novo":
        return `🟡 Contexto de la situación:
Estás en una fiesta o evento social y quieres conocer gente nueva.

🔵 Desconocido: ¡Hola! Creo que no nos conocemos. Soy Sofía. ¿Estás disfrutando de la fiesta?`;
      case "Comprando roupas em uma loja":
        return `🟡 Contexto de la situación:
Estás en una tienda de ropa buscando algo específico para comprar.

🔵 Dependiente: ¡Hola! Bienvenido/a a Fashion World. ¿Busca algo en concreto hoy?`;
      case "Resolvendo um problema no aeroporto":
        return `🟡 Contexto de la situación:
Estás en el aeropuerto y tienes un problema con tu vuelo o equipaje.

🔵 Personal del aeropuerto: ¡Buenos días! Veo que parece preocupado. ¿Cómo puedo ayudarle?`;
      case "Pedindo informação na rua":
        return `🟡 Contexto de la situación:
Estás en la Ciudad de México y necesitas ayuda para llegar a un museo.

🔵 Local: ¡Claro! Con gusto le ayudo. ¿A dónde intenta llegar exactamente?`;
      case "Conversando com um estrangeiro sobre cultura brasileira":
        return `🟡 Contexto de la situación:
Has conocido a un turista de habla hispana interesado en aprender sobre Brasil.

🔵 Turista: ¡Siempre he querido visitar Brasil! He oído que la cultura es increíblemente rica. ¿Qué hace que tu país sea tan especial?`;
      case "Participando de uma reunião de trabalho":
        return `🟡 Contexto de la situación:
Estás en una reunión de trabajo internacional por videoconferencia.

🔵 Gerente: ¡Buenos días a todos! Gracias por unirse a nuestra reunión. Empecemos con las actualizaciones. ¿Podrías contarnos tu progreso?`;
      case "Fazendo um passeio com alguém que você acabou de conhecer":
        return `🟡 Contexto de la situación:
Estás haciendo turismo y conociste a alguien que se ofreció para mostrarte la ciudad.

🔵 Nuevo amigo: ¡Estoy muy emocionado de mostrarte los alrededores! Este es uno de mis lugares favoritos de la ciudad. ¿Qué te parece hasta ahora?`;
      default:
        return `🟡 Contexto de la situación:
Prepárate para practicar español en una situación real.

🔵 Compañero: ¡Hola! ¿Estás listo/a para empezar nuestra conversación?`;
    }
  }

  // Fallback to English
  switch (situation) {
    case "Pedindo comida em um restaurante":
      return `🟡 Contexto da situação:
Você está em um restaurante nos EUA e quer pedir sua comida favorita.

🔵 Waiter: Good evening! Welcome to our restaurant. Have you had a chance to look at the menu?`;
    case "Fazendo check-in em um hotel":
      return `🟡 Contexto da situação:
Você chegou ao hotel depois de uma longa viagem e precisa fazer o check-in.

🔵 Receptionist: Good afternoon! Welcome to Grand Plaza Hotel. How may I assist you today?`;
    case "Conhecendo alguém novo":
      return `🟡 Contexto da situação:
Você está em uma festa ou evento social e quer conhecer pessoas novas.

🔵 Stranger: Hi there! I don't think we've met before. I'm Sarah. Are you enjoying the party?`;
    case "Comprando roupas em uma loja":
      return `🟡 Contexto da situação:
Você está em uma loja de roupas procurando algo específico para comprar.

🔵 Store Clerk: Hi! Welcome to Fashion World. Are you looking for anything specific today?`;
    case "Resolvendo um problema no aeroporto":
      return `🟡 Contexto da situação:
Você está no aeroporto e tem um problema com seu voo ou bagagem.

🔵 Airport Staff: Good morning! I can see you look concerned. How can I help you today?`;
    case "Pedindo informação na rua":
      return `🟡 Contexto da situação:
Você está em Nova York e precisa de ajuda para chegar até o museu da cidade.

🔵 Local: Of course! I'd be happy to help. Where exactly are you trying to go?`;
    case "Conversando com um estrangeiro sobre cultura brasileira":
      return `🟡 Contexto da situação:
Você conheceu um turista interessado em aprender sobre o Brasil.

🔵 Tourist: I've always wanted to visit Brazil! I heard the culture is incredibly rich. What makes your country so special?`;
    case "Participando de uma reunião de trabalho":
      return `🟡 Contexto da situação:
Você está em uma reunião de trabalho internacional via videoconferência.

🔵 Manager: Good morning everyone! Thank you for joining our quarterly review meeting. Let's start with project updates. Could you tell us about your current progress?`;
    case "Fazendo um passeio com alguém que você acabou de conhecer":
      return `🟡 Contexto da situação:
Você está fazendo turismo e conheceu alguém que se ofereceu para mostrar a cidade.

🔵 New Friend: I'm so excited to show you around! This is one of my favorite spots in the city. What do you think of it so far?`;
    default:
      return `🟡 Contexto da situação:
Prepare-se para praticar inglês em uma situação real.

🔵 Partner: Hello! Are you ready to start our conversation?`;
  }
}
