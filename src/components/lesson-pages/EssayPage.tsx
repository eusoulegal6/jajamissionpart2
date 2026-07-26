import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader, SkipForward, HelpCircle } from "lucide-react";
import { useChatApi } from "@/hooks/use-chat-api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTeacherMode } from "@/contexts/TeacherModeContext";
import { useNavigate, useLocation } from "react-router-dom";

interface EssayPageProps {
  topic: string;
  instructions?: string;
  onComplete?: () => void;
  isEmbedded?: boolean;
  lessonData?: any;
  selectedDifficulty?: string;
  lessonId?: string;
  currentPageIndex?: number;
}

const EssayPage: React.FC<EssayPageProps> = ({
  topic,
  instructions,
  onComplete,
  isEmbedded = false,
  lessonData,
  selectedDifficulty,
  lessonId,
  currentPageIndex,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, learningLanguage, tLesson } = useLanguage();
  const { isTeacherMode } = useTeacherMode();

  const [userEssay, setUserEssay] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [portugueseFeedback, setPortugueseFeedback] = useState<string | null>(null);
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);
  const [isTranslatingFeedback, setIsTranslatingFeedback] = useState(false);
  const [isActivityCompleted, setIsActivityCompleted] = useState(false);
  const [showAIInterface, setShowAIInterface] = useState(!isTeacherMode);

  const { sendMessage } = useChatApi();

  // Enhanced effect to reset state when component mounts or topic changes
  useEffect(() => {
    console.log("EssayPage - Resetting state for topic:", topic);
    setUserEssay("");
    setFeedback(null);
    setPortugueseFeedback(null);
    setIsGettingFeedback(false);
    setIsTranslatingFeedback(false);
    setIsActivityCompleted(false);
  }, [topic]);

  const handleGetFeedback = async () => {
    if (!userEssay.trim()) return;

    setIsGettingFeedback(true);
    setFeedback(null);
    setPortugueseFeedback(null);

    try {
      const prompt = `Please analyze this essay written by a ${learningLanguage} language learner about "${topic}".

Essay: "${userEssay}"

Please provide constructive feedback covering:
1. Content and ideas
2. Grammar and language use
3. Vocabulary usage
4. Structure and organization
5. Specific suggestions for improvement

Be encouraging but specific about areas for improvement. Respond in ${learningLanguage}.`;

      const response = await sendMessage(prompt, "essay");
      
      if (response?.content) {
        setFeedback(response.content);
        
        // If the learning language is not English, translate the feedback
        if (learningLanguage !== "en") {
          setIsTranslatingFeedback(true);
          try {
            const translationPrompt = `Translate this essay feedback to Portuguese, maintaining the constructive and encouraging tone:\n\n${response.content}`;
            const translationResponse = await sendMessage(translationPrompt, "essay");
            
            if (translationResponse?.content) {
              setPortugueseFeedback(translationResponse.content);
            }
          } catch (error) {
            console.error("Translation error:", error);
          } finally {
            setIsTranslatingFeedback(false);
          }
        }
      }
    } catch (error) {
      console.error("Error getting feedback:", error);
    } finally {
      setIsGettingFeedback(false);
    }
  };

  const handleAskSpecialist = () => {
    const stateToPass = {
      essayState: {
        topic,
        instructions,
        userEssay,
        feedback,
        portugueseFeedback,
        lessonData,
        selectedDifficulty,
        lessonId,
        currentPageIndex,
        returnPath: location.pathname
      }
    };

    navigate("/specialist-help", { state: stateToPass });
  };

  const handleNext = () => {
    setIsActivityCompleted(true);
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (onComplete) {
      onComplete();
    }
  };

  if (isActivityCompleted && !isEmbedded) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <div className="text-green-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">{tLesson("activityCompleted")}</h2>
            <p className="text-muted-foreground mb-4">{tLesson("goodJob")}</p>
            <Button onClick={() => navigate("/")} className="w-full">
              {tLesson("backToHome")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Topic and Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{topic}</CardTitle>
          </CardHeader>
          <CardContent>
            {instructions && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">{instructions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Writing Area */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Sua Redação</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={userEssay}
              onChange={(e) => setUserEssay(e.target.value)}
              placeholder="Comece a escrever sua redação aqui..."
              className="min-h-[300px] resize-none"
              disabled={isGettingFeedback}
            />
            
            <div className="flex gap-3 mt-4">
              {showAIInterface && (
                <Button
                  onClick={handleGetFeedback}
                  disabled={!userEssay.trim() || isGettingFeedback}
                  className="flex-1"
                >
                  {isGettingFeedback ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    "Obter Feedback da IA"
                  )}
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={handleAskSpecialist}
                className="flex items-center gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                Pedir Ajuda
              </Button>
              
              {onComplete && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="flex items-center gap-2"
                >
                  <SkipForward className="h-4 w-4" />
                  Pular
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Feedback Section */}
        {(feedback || isGettingFeedback) && (
          <Card>
            <CardHeader>
              <CardTitle>Feedback da IA</CardTitle>
            </CardHeader>
            <CardContent>
              {isGettingFeedback ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-6 w-6 animate-spin mr-2" />
                  <span>Analisando sua redação...</span>
                </div>
              ) : feedback ? (
                <div className="space-y-4">
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap">{feedback}</div>
                  </div>
                  
                  {/* Portuguese Translation */}
                  {learningLanguage !== "en" && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-muted-foreground mb-2">
                        Tradução para Português:
                      </h4>
                      {isTranslatingFeedback ? (
                        <div className="flex items-center">
                          <Loader className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm text-muted-foreground">Traduzindo...</span>
                        </div>
                      ) : portugueseFeedback ? (
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {portugueseFeedback}
                        </div>
                      ) : null}
                    </div>
                  )}
                  
                  {onComplete && (
                    <div className="flex justify-center pt-4">
                      <Button onClick={handleNext}>
                        Continuar
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EssayPage;