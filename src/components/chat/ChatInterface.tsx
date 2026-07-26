import React, { FormEvent, useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Send, 
  MessageCircle,
  HelpCircle,
  BookOpen,
  Briefcase,
  Loader, 
  Mic,
  RefreshCw,
  Camera,
  Headphones,
  LogOut,
  Speech,
  GraduationCap
} from "lucide-react";
import ChatMessage from "./ChatMessage";
import ListeningMessage from "./ListeningMessage";
import FeedbackWizard, { parseFeedbackCards } from "./FeedbackWizard";
import AudioComparison from "./AudioComparison";
import { useAudioRecording } from "@/hooks/use-audio-recording";
import { RecordingIndicator, StopRecordingButton, AudioPreview } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { AppMode } from "@/types/AppMode";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePhoneAuth } from "@/contexts/PhoneAuthContext";
import { getCorrectedSentence } from "@/hooks/use-chat-api";
import { supabase } from "@/integrations/supabase/client";
import { base64ToAudioBlob } from "@/utils/base64Utils";
import { useNavigate } from "react-router-dom";
import SpecialistQuestionModal from "@/components/SpecialistQuestionModal";
import TextSelectionMode from "@/components/TextSelectionMode";
import WordDefinitionModal from "@/components/WordDefinitionModal";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  image?: string;
}

interface ChatInterfaceProps {
  currentMode: AppMode;
  chatHistory: any[];
  rolePlaySettings?: {
    difficulty: string;
    situation: string;
  } | null;
  inputMessage: string;
  setInputMessage: (message: string) => void;
  isLoading: boolean;
  isPlaying: Record<number, boolean>;
  isPlayingSlow?: Record<number, boolean>;
  isLoadingAudio: Record<number, boolean>;
  handleSubmit: (e: React.FormEvent) => void;
  handleBackToHome: () => void;
  handleNewChat: () => void;
  handleSpeakMessage: (index: number, text: string) => void;
  handleSpeakMessageSlow?: (index: number, text: string) => void;
  handleSendMessage: (message: string) => void;
  handleImageUpload: (file: File) => void;
  hideHeader?: boolean;
  isFullScreen?: boolean;
  selectedWordForPronunciation?: string | null;
  handleRestartConversation?: () => void;
  handleRestartQuiz?: () => void;
  handleAskSpecialist?: () => void;
  currentGame?: string;
  handleStartGame?: (gameType: string) => void;
  corrections: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentMode,
  chatHistory,
  rolePlaySettings = null,
  inputMessage,
  setInputMessage,
  isLoading,
  isPlaying,
  isLoadingAudio,
  handleSubmit,
  handleBackToHome,
  handleNewChat,
  handleSpeakMessage,
  handleSpeakMessageSlow,
  isPlayingSlow = {},
  handleSendMessage,
  handleImageUpload,
  hideHeader = false,
  isFullScreen = true,
  selectedWordForPronunciation,
  handleRestartConversation,
  handleRestartQuiz,
  handleAskSpecialist,
  currentGame,
  handleStartGame,
  corrections
}) => {
  const { language } = useLanguage();
  const { logout } = usePhoneAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioComparisonData, setAudioComparisonData] = useState<{ userAudio: Blob, originalAudioText: string, userMessageIndex?: number, originalAudioTitle?: string } | null>(null);
  const { learningLanguage } = useLanguage();
  const navigate = useNavigate();

  // Word question modal states
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [isTextSelectionMode, setIsTextSelectionMode] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showWordDefinition, setShowWordDefinition] = useState(false);

  const handleHelpButtonClick = () => {
    if (currentMode === 'conversation' || currentMode === 'role-play' || currentMode === 'interview' || currentMode === 'quiz') {
      setShowQuestionModal(true);
    } else if (handleAskSpecialist) {
      handleAskSpecialist();
    }
  };

  const handleWordQuestion = () => {
    setShowQuestionModal(false);
    setIsTextSelectionMode(true);
  };

  const handleOtherQuestion = () => {
    setShowQuestionModal(false);
    if (handleAskSpecialist) {
      handleAskSpecialist();
    }
  };

  const handleWordSelected = (word: string) => {
    setIsTextSelectionMode(false);
    setSelectedWord(word);
    setShowWordDefinition(true);
  };

  const handleCancelTextSelection = () => {
    setIsTextSelectionMode(false);
  };

  const handleCloseWordDefinition = () => {
    setShowWordDefinition(false);
    setSelectedWord(null);
  };

  const {
    recordingState,
    isPlaying: isPlayingRecording,
    isTranscribing,
    handleMicButtonClick,
    stopRecording,
    playAudio,
    cancelAudio,
    sendAudio
  } = useAudioRecording(currentMode);
  
  useEffect(() => {
    console.log("ChatInterface: Recording state changed to:", recordingState?.status || 'undefined');
    console.log("ChatInterface: Full recording state:", recordingState);
  }, [recordingState]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  
  const getModeDetails = () => {
    switch (currentMode) {
      case "specialist":
        return { icon: <HelpCircle className="h-5 w-5" /> };
      case "assistant":
        return { icon: <MessageCircle className="h-5 w-5" /> };
      case "free-talk":
        return { icon: <BookOpen className="h-5 w-5" /> };
      case "listening":
        return { icon: <Headphones className="h-5 w-5" /> };
      default:
        return { icon: null };
    }
  };

  // Function to check if a message contains hidden phrase
  const isHiddenPhraseMessage = (message: ChatMessage) => {
    return message.role === "assistant" && 
           message.content.startsWith("<hidden_phrase>") && 
           message.content.endsWith("</hidden_phrase>");
  };

  // Function to check if this is a feedback message with play again option
  const isFeedbackMessage = (message: ChatMessage) => {
    return message.role === "assistant" && 
           !isHiddenPhraseMessage(message) &&
           (message.content.includes("Gostaria de jogar novamente?") || message.content.includes("Gostaria de tentar outra frase?"));
  };

  const handleListeningPlay = (messageIndex: number, message: ChatMessage) => {
    // For hidden phrase messages, extract the hidden phrase for audio
    if (isHiddenPhraseMessage(message)) {
      const hiddenPhrase = message.content.match(/<hidden_phrase>(.*?)<\/hidden_phrase>/)?.[1];
      if (hiddenPhrase) {
        handleSpeakMessage(messageIndex, hiddenPhrase);
        return;
      }
    }
    // For regular messages, use the full content
    handleSpeakMessage(messageIndex, message.content);
  };

  const handleListeningPlaySlow = (messageIndex: number, message: ChatMessage) => {
    if (!handleSpeakMessageSlow) return;
    
    // For hidden phrase messages, extract the hidden phrase for audio
    if (isHiddenPhraseMessage(message)) {
      const hiddenPhrase = message.content.match(/<hidden_phrase>(.*?)<\/hidden_phrase>/)?.[1];
      if (hiddenPhrase) {
        handleSpeakMessageSlow(messageIndex, hiddenPhrase);
        return;
      }
    }
    // For regular messages, use the full content
    handleSpeakMessageSlow(messageIndex, message.content);
  };

  const handlePlayAgain = () => {
    // Reset the chat to start a new listening game
    handleNewChat();
  };

  useEffect(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      const scrollTimeout = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      
      return () => clearTimeout(scrollTimeout);
    }
  }, [chatHistory, isLoading, shouldScrollToBottom]);
  
  useEffect(() => {
    setShouldScrollToBottom(true);
  }, [chatHistory.length]);

  useEffect(() => {
    const modesWithAudioComparison = ['listening', 'conversation', 'role-play'];
    if (!isLoading && !modesWithAudioComparison.includes(currentMode)) {
      setAudioComparisonData(null);
    }
  }, [isLoading, currentMode]);

  const handleSendAudio = async () => {
    console.log("handleSendAudio called - sending audio for transcription");
    const { transcribedText, recordedAudio } = await sendAudio();
    
    console.log("sendAudio result:", { 
      hasRecordedAudio: !!recordedAudio, 
      audioSize: recordedAudio ? recordedAudio.size : 0,
      hasTranscribedText: !!transcribedText, 
      transcribedText 
    });

    let newAudioComparisonData = null;
    
    if (transcribedText && recordedAudio) {
      const userMessageIndex = chatHistory.length;
      const contextMessages = chatHistory.slice(-4);

      // Handle 'listening' mode audio comparison
      if (currentMode === 'listening') {
        const lastMessage = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1] : null;
        if (lastMessage && isHiddenPhraseMessage(lastMessage)) {
          const hiddenPhrase = lastMessage.content.match(/<hidden_phrase>(.*?)<\/hidden_phrase>/)?.[1];
          if (hiddenPhrase) {
            console.log("Creating audio comparison for listening mode.");
            newAudioComparisonData = { userAudio: recordedAudio, originalAudioText: hiddenPhrase, userMessageIndex };
          }
        }
      } 
      // Handle 'conversation' with corrections
      else if (currentMode === 'conversation' && corrections) {
        console.log("Attempting grammar correction for conversation mode.");
        const correctedText = await getCorrectedSentence(transcribedText, learningLanguage, contextMessages);
        if (correctedText) {
          console.log("Creating audio comparison for conversation mode with correction.");
          newAudioComparisonData = {
            userAudio: recordedAudio,
            originalAudioText: correctedText,
            userMessageIndex,
            originalAudioTitle: t('como_nativo_falaria'),
          };
        } else {
          console.log("Grammar correction failed, not showing audio comparison for conversation mode.");
        }
      }
      // Handle 'role-play' mode
      else if (currentMode === 'role-play') {
        console.log("Attempting grammar correction for role-play mode.");
        const correctedText = await getCorrectedSentence(transcribedText, learningLanguage, contextMessages);
        
        // In role-play, always show comparison. Fallback to original text if correction fails.
        const textForComparison = correctedText || transcribedText;
        console.log("Creating audio comparison for role-play mode. Using text:", textForComparison);
        newAudioComparisonData = {
          userAudio: recordedAudio,
          originalAudioText: textForComparison,
          userMessageIndex,
          originalAudioTitle: correctedText ? t('como_nativo_falaria') : t('sua_transcricao'),
        };
      }

      console.log("Audio successfully transcribed, sending as message:", transcribedText);
      handleSendMessage(transcribedText);
      setShouldScrollToBottom(true);
    } else {
      console.error("Failed to transcribe audio or transcription returned empty");
    }
    
    console.log("Setting audio comparison data:", newAudioComparisonData);
    setAudioComparisonData(newAudioComparisonData);
  };
  
  const { icon } = getModeDetails();
  
  const { t } = useLanguage();
  const getEmptyStateMessage = () => {
    if (currentMode === "specialist") {
      return t('pergunte_qualquer');
    }
    return t('envie_mensagem');
  };
  
  const isEmptySpecialistMode = currentMode === "specialist" && chatHistory.length === 0;
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
      setShouldScrollToBottom(true);
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && handleImageUpload) {
      handleImageUpload(files[0]);
      e.target.value = '';
    }
  };
  
  const shouldShowTextInput = !recordingState || recordingState.status === 'idle' || recordingState.status === undefined;
  const shouldShowRecordingIndicator = recordingState && recordingState.status === 'recording';
  const shouldShowAudioPreview = recordingState && recordingState.status === 'preview';
  
  console.log("ChatInterface render - Input display logic:", {
    currentMode,
    recordingStateExists: !!recordingState,
    recordingStatus: recordingState?.status,
    shouldShowTextInput,
    shouldShowRecordingIndicator,
    shouldShowAudioPreview,
    chatHistoryLength: chatHistory.length,
    isEmptySpecialistMode
  });

  const [isPronunciationLoading, setIsPronunciationLoading] = useState(false);

  const handlePronounceWord = async (word: string) => {
    setIsPronunciationLoading(true);
    try {
      console.log('Calling TTS function for pronunciation of word:', word);
      
      // Use Supabase client's invoke method which handles authentication automatically
      const { data, error } = await supabase.functions.invoke('speak-elevenlabs', {
        body: { text: word }
      });
      
      if (error) {
        console.error('TTS Error:', error);
        throw new Error(`Falha ao gerar áudio: ${error.message || 'Erro desconhecido'}`);
      }
      
      if (!data || !data.audioContent) {
        throw new Error("Resposta inválida do serviço de áudio");
      }

      console.log('Received audio content for pronunciation, converting to blob...');

      try {
        // Convert base64 to blob using the utility function
        const audioBlob = base64ToAudioBlob(data.audioContent);
        const audioUrl = URL.createObjectURL(audioBlob);
        
        console.log('Audio blob created successfully for pronunciation, size:', audioBlob.size);
        
        const audio = new Audio(audioUrl);
        audio.play().catch(error => {
          console.error("Failed to play pronunciation audio:", error);
          toast({
            title: "Erro",
            description: "Não foi possível reproduzir a pronúncia.",
            variant: "destructive",
          });
        });
      } catch (conversionError) {
        console.error('Error converting pronunciation audio data:', conversionError);
        throw new Error(`Erro ao processar dados de áudio: ${conversionError.message}`);
      }
    } catch (error) {
      console.error("Failed to load pronunciation audio:", error);
      
      let errorMessage = "Não foi possível carregar a pronúncia. Por favor, tente novamente.";
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes("too long")) {
          errorMessage = "O texto é muito longo para conversão em áudio.";
        } else if (error.message.includes("too large")) {
          errorMessage = "O arquivo de áudio gerado é muito grande.";
        } else if (error.message.includes("API key")) {
          errorMessage = "Configuração de áudio não encontrada.";
        } else if (error.message.includes("decode")) {
          errorMessage = "Erro ao processar o áudio gerado.";
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPronunciationLoading(false);
    }
  };

  const handleNewChatClick = () => {
    setAudioComparisonData(null);
    handleNewChat();
  };

  // Check if we should show the camera upload button for real-world hunt game
  const isRealWorldHuntGame = currentMode === "games" && currentGame === "realWorldHunt";

  return (
    <div className={`flex flex-col ${isFullScreen ? 'h-screen' : 'h-full'} bg-gray-50`}>
      {/* Header - conditionally rendered */}
      {!hideHeader && (
        <div className="chat-header">
          <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto flex items-center justify-between w-full">
            <div className="flex items-center gap-3 md:gap-8">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleBackToHome}
                className="text-[#202123] hover:bg-[#ececf1] transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              {icon && (
                <div className="flex items-center">
                  {icon}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button 
                onClick={handleNewChatClick}
                variant="ghost" 
                className="text-[#10a37f] hover:text-[#0e8e6d] font-medium text-sm transition-colors hover:underline"
              >
                {t('nova_conversa')}
              </Button>
              {currentMode === 'specialist' && (
                <Button 
                  onClick={() => navigate('/specialist-help', { state: { showPronunciation: true, returnPath: '/' } })}
                  variant="default"
                  className="rounded-full bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white shadow-md hover:shadow-lg hover-scale"
                >
                  <Speech className="h-4 w-4 mr-2" />
                  {t('pronuncia')}
                </Button>
              )}
              {handleAskSpecialist && currentMode !== 'specialist' && (
                <Button 
                  onClick={handleHelpButtonClick}
                  variant="ghost" 
                  size="icon"
                  className="text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Ask a specialist"
                  aria-label="Pergunte ao especialista"
                  disabled={isLoading && (currentMode === 'conversation' || currentMode === 'interview' || currentMode === 'quiz' || currentMode === 'listening' || currentMode === 'role-play')}
                >
                  <img src="/lovable-uploads/8fb056c5-eff7-4a39-a6a5-a715bf7d5bbe.png" alt="Pergunte ao especialista" className="h-7 w-7" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className={`flex-1 ${isFullScreen ? 'overflow-y-auto' : ''} px-4 py-6 ${chatHistory.length === 0 ? 'flex items-center justify-center' : ''}`}>
        <div className={`max-w-4xl mx-auto ${chatHistory.length === 0 ? 'w-full' : 'space-y-6'}`}>
          {chatHistory.length === 0 ? (
            /* Empty State */
            <div className="flex items-center justify-center">
              <div className="text-3xl font-semibold text-muted-foreground text-center md:text-2xl px-4">
                {getEmptyStateMessage()}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="chat-messages">
              {chatHistory.map((message, index) => {
                const shouldUseFeedbackWizard =
                  message.role === 'assistant' &&
                  (
                    currentMode === 'interview' ||
                    currentMode === 'role-play' ||
                    (currentMode === 'conversation' && !!rolePlaySettings)
                  );

                const feedbackCards = shouldUseFeedbackWizard
                  ? parseFeedbackCards(message.content)
                  : null;

                const isLastMessage = index === chatHistory.length - 1;

                return (
                <React.Fragment key={index}>
                  {feedbackCards ? (
                    <div className="flex justify-start">
                      <div className="w-full max-w-[85%]">
                        <FeedbackWizard cards={feedbackCards} autoExpand={isLastMessage} onGoHome={handleBackToHome} />
                      </div>
                    </div>
                  ) : currentMode === "listening" && (isHiddenPhraseMessage(message) || isFeedbackMessage(message)) ? (
                    <ListeningMessage
                      message={message}
                      index={index}
                      isPlaying={isPlaying[index] || false}
                      isLoading={isLoadingAudio[index] || false}
                      onPlay={() => handleListeningPlay(index, message)}
                      onPlayAgain={isFeedbackMessage(message) ? handlePlayAgain : undefined}
                      onPlaySlow={handleSpeakMessageSlow ? () => handleListeningPlaySlow(index, message) : undefined}
                      isPlayingSlow={isPlayingSlow[index] || false}
                      onSendMessage={handleSendMessage}
                    />
                  ) : (
                    <ChatMessage
                      message={message}
                      index={index}
                      isPlaying={isPlaying[index] || false}
                      isLoading={isLoadingAudio[index] || false}
                      onPlay={() => handleSpeakMessage(index, message.content)}
                      selectedWordForPronunciation={selectedWordForPronunciation}
                      onPronounceWord={handlePronounceWord}
                      isPronunciationLoading={isPronunciationLoading}
                    />
                  )}
                  {audioComparisonData && audioComparisonData.userMessageIndex === index && (
                    <AudioComparison
                      userAudio={audioComparisonData.userAudio}
                      originalAudioText={audioComparisonData.originalAudioText}
                      originalAudioTitle={audioComparisonData.originalAudioTitle}
                    />
                  )}
                </React.Fragment>
                );
              })}
              {isLoading && (() => {
                const isRolePlayFeedbackMode = currentMode === 'role-play' || (currentMode === 'conversation' && !!rolePlaySettings);
                const isInterviewFeedbackMode = currentMode === 'interview';
                const userMessages = chatHistory.filter(m => m.role === 'user').length;

                const shouldShowRolePlayFeedbackLoading = isRolePlayFeedbackMode && userMessages === 9;
                const shouldShowInterviewFeedbackLoading = isInterviewFeedbackMode && userMessages === 8;
                const showFeedbackLoading = shouldShowRolePlayFeedbackLoading || shouldShowInterviewFeedbackLoading;

                if (showFeedbackLoading) {
                  return (
                    <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100">
                      <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
                        <div className="relative">
                          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl animate-pulse">
                            <GraduationCap className="h-10 w-10 text-white" />
                          </div>
                          <div className="absolute -inset-3 rounded-full border-4 border-emerald-200 animate-spin" style={{ borderTopColor: 'transparent', animationDuration: '2s' }} />
                        </div>
                        <div className="text-center space-y-2">
                          <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
                            Preparando seu feedback
                          </h2>
                          <p className="text-sm md:text-base text-muted-foreground max-w-xs">
                            Analisando suas respostas e preparando correções detalhadas...
                          </p>
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          {[0, 1, 2].map(i => (
                            <div key={i} className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${i * 200}ms` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="flex justify-start">
                    <div className="message-bubble assistant-message">
                      <div className="flex items-start">
                        <div className="flex items-center">
                          <Loader className="h-4 w-4 animate-spin text-[#6e6e80]" />
                          <span className="ml-2 text-[15px] text-[#6e6e80]">
                            {t('pensando')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>
      
      {/* Fixed Input Area */}
      <div className="chat-input-area">
        <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl w-full mx-auto px-4 py-4">
          {shouldShowRecordingIndicator && (
            <div className="mb-4">
              <RecordingIndicator />
              <div className="flex justify-center mt-2">
                <StopRecordingButton onClick={stopRecording} />
              </div>
            </div>
          )}
          
          {shouldShowAudioPreview && (
            <div className="mb-4">
              <AudioPreview 
                isPlaying={isPlayingRecording} 
                onPlay={playAudio} 
                onSend={handleSendAudio}
                onDelete={cancelAudio}
                isTranscribing={isTranscribing}
              />
            </div>
          )}
          
          <div className={`transition-opacity duration-200 ${shouldShowTextInput ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (shouldShowTextInput && inputMessage.trim()) {
                  setAudioComparisonData(null);
                  handleSubmit(e);
                  setShouldScrollToBottom(true);
                }
              }} 
              className="flex items-end gap-3"
            >
              <div className="flex-grow relative">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={shouldShowTextInput ? t('mensagem_placeholder') : t('gravacao_andamento')}
                  autoGrow
                  maxHeight={150}
                  className="min-h-[50px] px-4 py-3 text-[#202123] bg-[#f7f7f8] border-[#dcdcdc] rounded-2xl text-base focus:ring-2 focus:ring-[#10a37f]/20 focus:outline-none shadow-sm pr-12 resize-none"
                  disabled={!shouldShowTextInput || isLoading}
                />
                
                <div className="absolute right-3 bottom-2 flex items-center gap-1">
                  {isRealWorldHuntGame && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={handleImageClick}
                      className="h-10 w-10 p-0 text-[#6e6e80] hover:text-[#10a37f] hover:bg-transparent"
                      disabled={!shouldShowTextInput || isLoading}
                      title="Upload photo"
                    >
                      <Camera className="h-6 w-6" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={handleMicButtonClick}
                    className="h-10 w-10 p-0 text-[#6e6e80] hover:text-[#10a37f] hover:bg-transparent"
                    disabled={!shouldShowTextInput || isLoading}
                  >
                    <Mic className="h-6 w-6" />
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                size="icon"
                disabled={!shouldShowTextInput || isLoading || !inputMessage.trim()}
                className="h-[46px] w-[46px] rounded-full bg-[#10a37f] hover:bg-[#0e8e6d] text-white flex items-center justify-center flex-shrink-0 shadow-sm transition-colors duration-200"
              >
                {isLoading ? 
                  <Loader className="h-5 w-5 animate-spin" /> : 
                  <Send className="h-5 w-5" />
                }
              </Button>
            </form>
          </div>
          
          {/* Hidden file input for image upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Question Modal for conversation/role-play modes */}
      <SpecialistQuestionModal
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        onWordQuestion={handleWordQuestion}
        onOtherQuestion={handleOtherQuestion}
      />

      {/* Text Selection Mode overlay */}
      <TextSelectionMode
        isActive={isTextSelectionMode}
        onCancel={handleCancelTextSelection}
        onConfirm={handleWordSelected}
      />

      {/* Word Definition Modal */}
      <WordDefinitionModal
        word={selectedWord}
        isOpen={showWordDefinition}
        onClose={handleCloseWordDefinition}
      />
    </div>
  );
};

export default ChatInterface;
