import { useState } from "react";
import { callAI } from "@/lib/aiBridge";
import { useLanguage } from "@/contexts/LanguageContext";

export const useDetailedCorrection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { learningLanguage } = useLanguage();

  const getDetailedCorrection = async (
    userText: string, 
    correctedVersion: string,
    question: string, 
    difficulty?: string
  ): Promise<string | null> => {
    if (!userText.trim() || !correctedVersion.trim()) return null;

    setIsLoading(true);

    const isSpanish = learningLanguage === 'es';

    const correctionPrompt = isSpanish
      ? `Compara estos dos textos y explica las diferencias:

TEXTO DEL ALUMNO:
"${userText}"

TEXTO CORRECTO:
"${correctedVersion}"

INSTRUCCIONES:
1. Si son idénticos, responde SOLAMENTE: "¡Tu respuesta es perfecta! No hay correcciones necesarias."

2. Si son diferentes, para CADA error, muestra SOLAMENTE las líneas de corrección en este formato exacto. NO escribas ninguna introducción, título, resumen ni versión corregida. Sólo las correcciones.

FORMATO OBLIGATORIO (una línea por error):
"texto_incorrecto"(texto_correcto): explicación con **palabras clave en negrita** para destacar lo importante:

REGLAS DE NEGRITA:
- Usa **negrita** para destacar la palabra o regla gramatical clave en cada explicación
- Ejemplo: Usa la estructura **"a mí no me gustan"** para expresar disgusto
- Ejemplo: Agrega el artículo **"la"** antes de "realidad"
- NO uses negrita en el texto entre comillas ni paréntesis, sólo en la explicación

IMPORTANTE: 
- Agrupa palabras relacionadas juntas (no separes palabra por palabra)
- Si falta una palabra, muestra el contexto alrededor
- Si sobra una palabra, muestra el contexto alrededor
- NO corrijas signos de puntuación (comas, puntos, signos de interrogación, etc.) ni errores de mayúsculas/minúsculas
- NO escribas "Versión corregida", "Texto corregido", resúmenes ni conclusiones
- SÓLO escribe las líneas de corrección en el formato indicado

EJEMPLO:
"Yo no gustar"(A mí no me gustan): Usa la estructura **"a mí no me gustan"** para expresar disgusto correctamente:
"gustar"(gustan las caricaturas): Agrega **"las caricaturas"** después del verbo para completar el objeto:
"realidad"(la realidad.): Agrega el artículo **"la"** antes de "realidad":

Ahora compara los textos de arriba:`
      : `Compare estes dois textos e explique as diferenças:

TEXTO DO ALUNO:
"${userText}"

TEXTO CORRETO:
"${correctedVersion}"

INSTRUÇÕES:
1. Se forem idênticos, responda SOMENTE: "Sua resposta está perfeita! Não há correções necessárias."

2. Se forem diferentes, para CADA erro, mostre SOMENTE as linhas de correção neste formato exato. NÃO escreva nenhuma introdução, título, resumo nem versão corrigida. Apenas as correções.

FORMATO OBRIGATÓRIO (uma linha por erro):
"texto_errado"(texto_correto): explicação com **palavras-chave em negrito** para destacar o importante:

REGRAS DE NEGRITO:
- Use **negrito** para destacar a palavra ou regra gramatical chave em cada explicação
- Exemplo: Adicione **"do"** antes de "not" para formar a negativa correta
- Exemplo: Adicione o pronome **"I"** após "because" para indicar o sujeito
- NÃO use negrito no texto entre aspas nem parênteses, apenas na explicação

IMPORTANTE: 
- Agrupe palavras relacionadas juntas (não separe palavra por palavra)
- Se uma palavra está faltando, mostre o contexto ao redor
- Se uma palavra está sobrando, mostre o contexto ao redor
- NÃO corrija sinais de pontuação (vírgulas, pontos, pontos de interrogação, etc.) nem erros de maiúsculas/minúsculas
- NÃO escreva "Versão corrigida", "Texto corrigido", resumos nem conclusões
- SOMENTE escreva as linhas de correção no formato indicado

EXEMPLO:
"I not like"(I do not like): Adicione **"do"** antes de "not" para formar a negativa correta:
"like"(like cartoons): Adicione **"cartoons"** após "like" para completar o objeto da frase:
"because"(because I): Adicione **"I"** após "because" para indicar o sujeito da segunda oração:

Agora compare os textos acima:`;

    try {
      const response = await callAI({
        messages: [
          { role: "system", content: correctionPrompt },
          { role: "user", content: `Analise: "${userText}" vs "${correctedVersion}"` }
        ]
      });

      return response || null;
    } catch (error) {
      console.error("Error getting detailed correction:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getDetailedCorrection,
    isLoading,
  };
};
