
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useChatApi } from "@/hooks/use-chat-api";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { useSystemPrompt } from "@/hooks/use-system-prompt";
import ChatInterface from "./chat/ChatInterface";
import ChatMessage from "./chat/ChatMessage";
import { useLanguage } from "@/contexts/LanguageContext";
import { useKraken } from "@/contexts/KrakenContext";
import PronunciationAssistant from "./chat/PronunciationAssistant";
import LessonPagePreview from "./LessonPagePreview";
import { LessonPageContext, buildLessonDoubtSystemPrompt } from "@/types/lessonContext";

const renderFormattedText = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const SpecialistHelp: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Generic return logic
  const returnPath = location.state?.returnPath;
  const returnState = location.state?.returnState;
  const lessonData = location.state?.lessonData; // for legacy lesson runner
  const initialMessage = location.state?.initialMessage;
  
  // Listening state preservation - preserve all listening-related state
  const listeningState = location.state?.listeningState;
  
  // Lesson page context for "other doubt" flow
  const initialLessonContext = location.state?.lessonContext as LessonPageContext | undefined;
  const [lessonContext] = useState<LessonPageContext | undefined>(initialLessonContext);
  
  // Extract selected word from initial message
  const [selectedWordForPronunciation, setSelectedWordForPronunciation] = useState<string | null>(null);
  
  React.useEffect(() => {
    if (initialMessage && initialMessage.includes('"') && initialMessage.includes('Por favor me explique o significado desta palavra')) {
      const match = initialMessage.match(/"([^"]+)"/);
      if (match) {
        setSelectedWordForPronunciation(match[1]);
        console.log("Selected word for pronunciation:", match[1]);
      }
    }
  }, [initialMessage]);
  
  const [inputMessage, setInputMessage] = useState("");
  
  const { learningLanguage } = useLanguage();
  const { releaseKraken, isKrakenReleased } = useKraken();
  const [showPronunciation, setShowPronunciation] = useState(false);
  
  // Build enhanced system prompt if lesson context exists
  const baseSystemPrompt = useSystemPrompt({ currentMode: "specialist", learningLanguage });
  const enhancedSystemPrompt = React.useMemo(() => {
    if (!lessonContext) return baseSystemPrompt;
    const contextPrompt = buildLessonDoubtSystemPrompt(lessonContext);
    return `${contextPrompt}\n\n${baseSystemPrompt}`;
  }, [lessonContext, baseSystemPrompt]);
  
  // Open Pronunciation Assistant directly if requested via navigation state
  useEffect(() => {
    if (location.state?.showPronunciation) {
      setShowPronunciation(true);
    }
  }, [location.state]);
  
  // Use chat API and TTS hooks
  const { chatHistory, isLoading, sendMessage, sendImage, clearChat } = useChatApi();
  const { 
    isPlaying, 
    isLoadingAudio, 
    handleSpeakMessage 
  } = useTextToSpeech();

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && chatHistory.length === 0) {
      sendMessage(initialMessage, enhancedSystemPrompt);
    }
  }, [initialMessage, chatHistory.length, sendMessage, enhancedSystemPrompt]);

  const handleBack = () => {
    console.log('🔙🔙🔙 RETURNING FROM SPECIALIST - VALUES:', { 
      returnPath, 
      'lessonData exists': !!lessonData,
      'lessonData.currentPageIndex': lessonData?.currentPageIndex,
      'lessonData.aiFeedbackQuestionIndex': lessonData?.aiFeedbackQuestionIndex,
      'lessonData.lessonId': lessonData?.lessonId,
      'full lessonData': JSON.stringify(lessonData, null, 2)
    });

    // 1) If we came from a lesson, ALWAYS go back to the lesson (to the page they were on)
    if (lessonData) {
      // Extract the proper lessonId from lesson data
      let extractedLessonId: string | undefined | any;

      // Try to get lessonId from lesson.id first (most reliable)
      if (lessonData.lesson?.id) {
        extractedLessonId = lessonData.lesson.id;
      }
      // If lessonId is a malformed object, try to extract value
      else if (lessonData.lessonId && typeof lessonData.lessonId === 'object') {
        extractedLessonId = (lessonData.lessonId as any)?.value || (lessonData.lessonId as any)?.id;
      }
      // Otherwise use lessonId directly if it's a string
      else if (typeof lessonData.lessonId === 'string') {
        extractedLessonId = lessonData.lessonId;
      }

      // Normalize to string if an object slipped through
      console.log('SpecialistHelp - Extracted lessonId (raw):', extractedLessonId);
      if (typeof extractedLessonId !== 'string') {
        extractedLessonId = (extractedLessonId as any)?.value || (extractedLessonId as any)?.id || undefined;
      }
      if (!extractedLessonId && (location.state as any)?.lessonId) {
        extractedLessonId = (location.state as any).lessonId as string;
      }
      if (!extractedLessonId && returnState?.lessonId) {
        extractedLessonId = returnState.lessonId as string;
      }
      console.log('SpecialistHelp - Extracted lessonId (normalized):', extractedLessonId);

      if (typeof extractedLessonId === 'string' && extractedLessonId !== 'undefined') {
        // Navigate back to the page they were on (not always page 1)
        const pageIndex = lessonData.currentPageIndex ?? 0;
        const pageParam = pageIndex + 1; // Convert 0-based to 1-based
        const difficultyParam = lessonData.selectedDifficulty ? `difficulty=${encodeURIComponent(lessonData.selectedDifficulty)}` : '';
        // Preserve ALL lesson state including question indices and quiz states
        const navigationState: any = {
          lesson: lessonData.lesson,
          selectedDifficulty: lessonData.selectedDifficulty,
          lessonId: extractedLessonId,
          currentPageIndex: pageIndex,
          aiFeedbackQuestionIndex: lessonData.aiFeedbackQuestionIndex, // Preserve AI feedback question
          trueFalseWithTextQuestionIndex: lessonData.trueFalseWithTextQuestionIndex, // Preserve TrueFalseWithText question
          listeningStates: lessonData.listeningStates, // Preserve listening states
          returnPath: lessonData.returnPath,
          trueFalseQuizStates: lessonData.trueFalseQuizStates, // Preserve true/false states
          multipleChoiceWithTextStates: lessonData.multipleChoiceWithTextStates, // Preserve multiple choice states
        };
        
        // Preserve video quiz state if it exists
        if (lessonData.videoQuizState) {
          navigationState.videoQuizState = lessonData.videoQuizState;
        }

        console.log('SpecialistHelp - Navigating back with preserved state:', navigationState);

        navigate(`/lesson/${encodeURIComponent(extractedLessonId)}?${difficultyParam}&page=${pageParam}`, {
          state: navigationState,
        });
        return;
      }
    }

    // 2) Otherwise, fall back to explicit returnPath behavior
    if (returnPath === '/' && returnState?.restoreConversation) {
      // Returning to Index page with conversation restoration
      console.log('🔙 SpecialistHelp - Returning to Index with conversation restoration');
      navigate(returnPath, {
        state: {
          restoreConversation: true,
        },
        replace: true,
      });
      return;
    }

    if (returnPath) {
      // If returning to listening page, preserve ALL the listening state
      if (returnPath === "/listening" && listeningState) {
        console.log('SpecialistHelp - Returning to listening with preserved state:', listeningState);
        navigate(returnPath, { state: listeningState });
        return;
      }
      navigate(returnPath, { state: returnState });
      return;
    }

    // 3) Final fallback: home
    navigate("/");
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleNewChat = () => {
    clearChat();
    setInputMessage("");
    setSelectedWordForPronunciation(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    
    const message = inputMessage.trim();
    console.log("📝 Message submitted:", message);
    console.log("🔍 Checking kraken code. Input:", `"${message.toLowerCase().trim()}"`);
    console.log("🐙 Kraken status before:", isKrakenReleased);
    
    setInputMessage("");
    
    // Check for kraken cheat code with multiple variations
    const normalizedMessage = message.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const krakenPhrases = [
      "release the kraken",
      "releasethe kraken", 
      "release thekraken",
      "releasethekraken"
    ];
    
    const isKrakenCode = krakenPhrases.some(phrase => 
      normalizedMessage === phrase || 
      normalizedMessage.includes(phrase) ||
      message.toLowerCase().trim() === phrase
    );
    
    console.log("🎯 Normalized message:", normalizedMessage);
    console.log("✅ Is kraken code detected:", isKrakenCode);
    
    if (isKrakenCode) {
      console.log("🚀 KRAKEN CODE DETECTED! Calling releaseKraken()");
      releaseKraken();
      console.log("🐙 Kraken status after release:", isKrakenReleased);
      await sendMessage("🐙 The kraken has been released! Check the home screen for new options.", enhancedSystemPrompt);
      return;
    }
    
    await sendMessage(message, enhancedSystemPrompt);
  };

  const handleSendMessage = async (message: string) => {
    // Check for kraken cheat code
    if (message.toLowerCase().trim() === "release the kraken") {
      releaseKraken();
      await sendMessage("🐙 The kraken has been released! Check the home screen for new options.", enhancedSystemPrompt);
      return;
    }
    
    await sendMessage(message, enhancedSystemPrompt);
  };

  const handleImageUpload = async (file: File) => {
    await sendImage(file, "", enhancedSystemPrompt);
  };

  const canReturn = returnPath || lessonData;
  
  // Hide pronunciation button when accessed from within a lesson or other mode
  const isAccessedFromLesson = Boolean(lessonData || location.state?.returnToLesson || returnPath);

  const returnButtonText = () => {
    return "Voltar";
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-50 flex flex-col">
      {/* Custom Header for Specialist Help */}
      <div className="bg-white border-b px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-4">
          {canReturn ? (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              {returnButtonText()}
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={handleBackToHome}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Início
            </Button>
          )}
          <img src="/lovable-uploads/8fb056c5-eff7-4a39-a6a5-a715bf7d5bbe.png" alt="Pergunte ao Especialista" className="h-8 w-8" />
          <div className="ml-auto flex items-center gap-2">
            {isKrakenReleased && (
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                🐙 Kraken Released!
              </div>
            )}
            {!isAccessedFromLesson && (
              <Button variant="default" onClick={() => setShowPronunciation(true)}>Pronúncia</Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 min-h-0 w-full flex flex-col">
        {showPronunciation ? (
          <div className="h-full w-full overflow-auto">
            <PronunciationAssistant />
          </div>
        ) : (
          <>
            {/* Scrollable content area with lesson preview and messages */}
            <div className="flex-1 min-h-0 overflow-auto bg-gray-50">
              {/* Lesson page context preview - scrolls away */}
              {lessonContext && (
                <div className="p-4 border-b bg-muted/30">
                  <p className="text-sm font-medium mb-2 text-foreground">
                    Você está perguntando sobre esta página:
                  </p>
                  <div className="max-w-2xl">
                    <LessonPagePreview lessonContext={lessonContext} />
                  </div>
                </div>
              )}
              
              {/* Messages */}
              <div className="px-4 py-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  {chatHistory.length === 0 ? (
                    <div className="text-lg text-gray-500 text-center md:text-base px-4">
                      Faça sua pergunta sobre inglês, gramática, vocabulário ou qualquer dúvida!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatHistory.map((message, index) => (
                        <div key={index}>
                          <div className={`p-4 rounded-lg ${message.role === 'user' ? 'bg-blue-50 ml-auto max-w-[80%]' : 'bg-white shadow-sm'}`}>
                            <p className="text-sm whitespace-pre-wrap">{typeof message.content === 'string' ? renderFormattedText(message.content) : JSON.stringify(message.content)}</p>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white rounded-lg shadow-sm p-4">
                            <div className="flex items-center">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              <span className="ml-2 text-sm text-gray-600">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Fixed Input Area at bottom */}
            <div className="flex-shrink-0 border-t bg-white">
              <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl w-full mx-auto px-4 py-4">
                <form 
                  onSubmit={handleSubmit}
                  className="flex items-end gap-3"
                >
                  <div className="flex-grow relative">
                    <Textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Mensagem"
                      className="min-h-[50px] px-4 py-3 text-gray-900 bg-gray-50 border-gray-300 rounded-2xl text-base focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-sm resize-none"
                      disabled={isLoading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={isLoading || !inputMessage.trim()}
                    className="h-[46px] w-[46px] rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center flex-shrink-0 shadow-sm"
                  >
                    {isLoading ? 
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 
                      <Send className="h-5 w-5" />
                    }
                  </Button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SpecialistHelp;
