import React, { useState, useMemo, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Square, Volume2, ChevronLeft, ChevronRight, Loader2, CheckCircle, Play, AlertTriangle, RotateCcw, Turtle, Eye } from 'lucide-react';
import { PNL_LESSONS, PNL_CATEGORY_LABELS, PNLCategory, PNLItem } from '@/data/pnlLessons';
import { useVocabularyAudio } from '@/hooks/useVocabularyAudio';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useTeacherMode } from '@/contexts/TeacherModeContext';
import { useAudioInput } from '@/contexts/AudioInputContext';
import PNLInstructionPopup from './PNLInstructionPopup';

export interface PronunciationSlidesPageData {
  type: 'pronunciationSlides';
  title: string;
  lessonId: string;
  category: PNLCategory;
}

interface PronunciationSlidesPageProps {
  pageData: PronunciationSlidesPageData;
  onComplete?: () => void;
  canProceed?: boolean;
  onCanProceedChange?: (canProceed: boolean) => void;
}

export interface PronunciationSlidesPageRef {
  handleExternalNext: () => boolean;
  handleExternalPrevious: () => boolean;
  isFirstSlide: () => boolean;
  isComplete: () => boolean;
}

type WordScore = {
  word: string;
  score: number;
  issue: string;
  tip: string;
};

type PronunciationResult = {
  score: number;
  accuracy: number;
  fluency: number;
  intonation: number;
  wordScores?: WordScore[];
  feedback: string;
  overallTip: string;
};

const PronunciationSlidesPage = forwardRef<PronunciationSlidesPageRef, PronunciationSlidesPageProps>(({
  pageData,
  onComplete,
  canProceed,
  onCanProceedChange,
}, ref) => {
  const { isTeacherMode } = useTeacherMode();
  const { isTabAudioActive, currentStream } = useAudioInput();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasCompletedSlideshow, setHasCompletedSlideshow] = useState(false);
  const [showInstructionPopup, setShowInstructionPopup] = useState(true);
  const [isTeacherFlipped, setIsTeacherFlipped] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [studentAudioUrl, setStudentAudioUrl] = useState<string | null>(null);
  const [isPlayingStudent, setIsPlayingStudent] = useState(false);
  const [isPlayingNative, setIsPlayingNative] = useState(false);
  const [isPlayingNativeSlow, setIsPlayingNativeSlow] = useState(false);
  const [extraWordInfo, setExtraWordInfo] = useState<{ extraWord: string; afterWord: string | null } | null>(null);
  const [isAnalyzingExtraWord, setIsAnalyzingExtraWord] = useState(false);
  const [playingWordIndex, setPlayingWordIndex] = useState<number | null>(null);
  const [mispronouncedSlideIndex, setMispronouncedSlideIndex] = useState(0);
  const [isPlayingMispronounced, setIsPlayingMispronounced] = useState(false);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const studentAudioRef = useRef<HTMLAudioElement | null>(null);
  const wordAudioRef = useRef<HTMLAudioElement | null>(null);
  const mispronouncedRef = useRef<HTMLDivElement | null>(null);

  const lesson = PNL_LESSONS[pageData.lessonId];
  const items: PNLItem[] = lesson?.[pageData.category] || [];
  const totalItems = items.length;
  const currentItem = items[currentIndex];

  // Preload all audio for this category
  const allTexts = useMemo(() => items.map(item => item.english), [items]);
  const { play: playNative, urlMap, isPreloading } = useVocabularyAudio(allTexts);

  // Play audio for a single word
  const playWordAudio = async (word: string, index: number) => {
    if (playingWordIndex !== null) return;
    
    setPlayingWordIndex(index);
    try {
      const { data, error } = await supabase.functions.invoke('cached-tts', {
        body: { text: word }
      });
      
      if (error || !data?.publicUrl) {
        console.error('Error generating word audio:', error, data);
        setPlayingWordIndex(null);
        return;
      }
      
      const audio = new Audio(data.publicUrl);
      wordAudioRef.current = audio;
      
      audio.onended = () => {
        setPlayingWordIndex(null);
        wordAudioRef.current = null;
      };
      audio.onerror = () => {
        console.error('Error playing audio from URL:', data.publicUrl);
        setPlayingWordIndex(null);
        wordAudioRef.current = null;
      };
      
      await audio.play();
    } catch (err) {
      console.error('Error playing word audio:', err);
      setPlayingWordIndex(null);
    }
  };

  const isFirstSlide = currentIndex === 0;
  const isLastSlide = currentIndex === totalItems - 1;

  // Check if current item is a single word or phrase
  const isMultiWord = (text: string) => text.trim().split(/\s+/).length > 1;

  // Reset all evaluation states when slide changes, page changes, or component mounts
  const resetEvaluationState = () => {
    setResult(null);
    setStudentAudioUrl(null);
    setIsRecording(false);
    setIsLoading(false);
    setExtraWordInfo(null);
    setIsAnalyzingExtraWord(false);
    setIsPlayingStudent(false);
    setIsPlayingNative(false);
    setPlayingWordIndex(null);
    setMispronouncedSlideIndex(0);
    setIsPlayingMispronounced(false);
    setIsTeacherFlipped(false);
    // Stop any playing audio
    if (studentAudioRef.current) {
      studentAudioRef.current.pause();
      studentAudioRef.current = null;
    }
    if (wordAudioRef.current) {
      wordAudioRef.current.pause();
      wordAudioRef.current = null;
    }
  };

  // Reset states when slide changes
  useEffect(() => {
    resetEvaluationState();
    // Show loading briefly when slide changes
    if (currentIndex > 0) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 400);
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  // Reset states when page data changes (lessonId or category)
  useEffect(() => {
    setCurrentIndex(0);
    setHasCompletedSlideshow(false);
    resetEvaluationState();
  }, [pageData.lessonId, pageData.category]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    handleExternalNext: () => {
      if (hasCompletedSlideshow) {
        return true;
      }
      
      if (isLastSlide) {
        setHasCompletedSlideshow(true);
        return true;
      } else {
        setCurrentIndex(prev => prev + 1);
        return false;
      }
    },
    handleExternalPrevious: () => {
      if (isFirstSlide) {
        return true;
      } else {
        setCurrentIndex(prev => prev - 1);
        return false;
      }
    },
    isFirstSlide: () => isFirstSlide,
    isComplete: () => hasCompletedSlideshow,
  }), [currentIndex, isFirstSlide, isLastSlide, hasCompletedSlideshow]);

  // Only allow proceeding after user has recorded and received a result (or in teacher mode)
  useEffect(() => {
    if (onCanProceedChange) {
      const canProceed = result !== null || isTeacherMode;
      onCanProceedChange(canProceed);
    }
  }, [onCanProceedChange, result, isTeacherMode]);

  // Scroll to mispronounced words section when result appears
  useEffect(() => {
    if (result && mispronouncedRef.current) {
      setTimeout(() => {
        mispronouncedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 500);
    }
  }, [result]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Recording functions
  const startRecording = async () => {
    try {
      // Debug: Log tab audio state
      console.log('PronunciationSlidesPage: startRecording called', {
        isTabAudioActive,
        hasCurrentStream: !!currentStream,
        currentStreamTracks: currentStream?.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState }))
      });
      
      // Check if tab audio is active, use that stream instead of microphone
      let stream: MediaStream;
      let usingTabAudio = false;
      
      if (isTabAudioActive && currentStream) {
        const audioTracks = currentStream.getAudioTracks();
        const activeTracks = audioTracks.filter(t => t.readyState === 'live');
        console.log('PronunciationSlidesPage: Tab audio tracks:', {
          total: audioTracks.length,
          active: activeTracks.length,
          trackDetails: audioTracks.map(t => ({ enabled: t.enabled, readyState: t.readyState, label: t.label }))
        });
        
        if (activeTracks.length > 0) {
          console.log('PronunciationSlidesPage: Using tab audio stream with', activeTracks.length, 'active audio track(s)');
          stream = new MediaStream(activeTracks);
          usingTabAudio = true;
        } else {
          console.log('PronunciationSlidesPage: Tab audio has no active audio tracks, falling back to microphone');
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } else {
        console.log('PronunciationSlidesPage: Using microphone (isTabAudioActive:', isTabAudioActive, ', hasStream:', !!currentStream, ')');
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setStudentAudioUrl(audioUrl);
        
        // Only stop tracks if we're NOT using tab audio (tab audio is managed globally)
        if (!usingTabAudio) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        // Send to API
        await sendToApi(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsLoading(true);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const sendToApi = async (audioBlob: Blob) => {
    try {
      const audioBase64 = await blobToBase64(audioBlob);
      
      const { data, error } = await supabase.functions.invoke("pronunciation-gemini", {
        body: {
          audioBase64,
          mimeType: "audio/webm",
          targetSentence: currentItem.english,
        },
      });

      if (error) {
        console.error("Error from pronunciation API:", error);
        return;
      }

      const pronunciationResult = data as PronunciationResult;
      setResult(pronunciationResult);
      
      // Analyze for extra words only for multi-word phrases
      if (isMultiWord(currentItem.english)) {
        analyzeForExtraWords(pronunciationResult);
      }
    } catch (err) {
      console.error("Error sending audio:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze the feedback to detect if an extra word was added and extract it
  const analyzeForExtraWords = async (pronunciationResult: PronunciationResult) => {
    setIsAnalyzingExtraWord(true);
    try {
      const fullFeedback = [
        pronunciationResult.feedback || "",
        pronunciationResult.overallTip || "",
        ...(pronunciationResult.wordScores || []).map(ws => `${ws.word}: ${ws.issue} - ${ws.tip}`),
      ].join("\n");

      const targetSentence = currentItem.english;

      const { data, error } = await supabase.functions.invoke("chatgpt", {
        body: {
          model: "gpt-5.2",
          messages: [
            {
              role: "system",
              content: `You are a pronunciation feedback analyzer. Your job is to detect if the feedback indicates that the speaker said an EXTRA word that was not part of the target sentence, and if so, extract what that extra word was and where it was placed.

Target sentence: "${targetSentence}"

Look for these patterns in the feedback:
- "extra word"
- "added word"
- "unnecessary word"  
- "word was added"
- "said X first then said Y" (indicating they said an extra word before the correct one)
- "initially said X" or "first said X"
- any mention of a word being spoken that shouldn't have been there
- "mispronounced as X and then said Y" pattern

You MUST respond with ONLY a JSON object, no other text:
- If NO extra word: {"hasExtraWord": false}
- If extra word found: {"hasExtraWord": true, "extraWord": "the extra word", "afterWord": "the word from target sentence after which it was said" or null if it was at the beginning}

Examples:
- If they said "the" before "apple" in "apple pie": {"hasExtraWord": true, "extraWord": "the", "afterWord": null}
- If they said "really" between "is" and "good" in "this is good": {"hasExtraWord": true, "extraWord": "really", "afterWord": "is"}

Be strict: only return hasExtraWord:true if there's clear evidence of an extra/unnecessary word being spoken.`
            },
            {
              role: "user",
              content: `Analyze this pronunciation feedback and determine if an extra word was added:\n\n${fullFeedback}`
            }
          ]
        }
      });

      if (error) {
        console.error("Error analyzing extra word:", error);
        return;
      }

      if (data?.reply) {
        const reply = typeof data.reply === 'object' ? data.reply : JSON.parse(data.reply);
        if (reply.hasExtraWord && reply.extraWord) {
          setExtraWordInfo({
            extraWord: reply.extraWord,
            afterWord: reply.afterWord || null
          });
        }
      }
    } catch (err) {
      console.error("Error in extra word analysis:", err);
    } finally {
      setIsAnalyzingExtraWord(false);
    }
  };

  const playStudentAudio = () => {
    if (!studentAudioUrl) return;
    
    if (studentAudioRef.current) {
      studentAudioRef.current.pause();
    }
    
    const audio = new Audio(studentAudioUrl);
    studentAudioRef.current = audio;
    
    setIsPlayingStudent(true);
    audio.onended = () => setIsPlayingStudent(false);
    audio.play().catch(err => {
      console.error('Error playing student audio:', err);
      setIsPlayingStudent(false);
    });
  };

  const handlePlayNative = async () => {
    if (!currentItem || isPlayingNative || isPlayingNativeSlow) return;
    
    setIsPlayingNative(true);
    try {
      await playNative(currentItem.english);
    } finally {
      // Set a timeout since we don't have exact audio end event from the hook
      setTimeout(() => setIsPlayingNative(false), 2000);
    }
  };

  const handlePlayNativeSlow = async () => {
    if (!currentItem || isPlayingNative || isPlayingNativeSlow) return;
    
    setIsPlayingNativeSlow(true);
    try {
      const audioUrl = urlMap[currentItem.english];
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.playbackRate = 0.5;
        audio.onended = () => setIsPlayingNativeSlow(false);
        audio.onerror = () => setIsPlayingNativeSlow(false);
        await audio.play();
      }
    } catch (err) {
      console.error('Error playing slow native audio:', err);
      setIsPlayingNativeSlow(false);
    }
  };

  // Get mispronounced words from phrase results
  const getMispronouncedWords = () => {
    if (!result || !result.wordScores || !isMultiWord(currentItem?.english || '')) return [];
    return result.wordScores.filter(ws => ws.score < 50).map(ws => ws.word);
  };

  // Play mispronounced word audio
  const playMispronouncedWord = async (word: string) => {
    if (isPlayingMispronounced) return;
    
    setIsPlayingMispronounced(true);
    try {
      const { data, error } = await supabase.functions.invoke('cached-tts', {
        body: { text: word }
      });
      
      if (error || !data?.publicUrl) {
        console.error('Error generating mispronounced word audio:', error, data);
        setIsPlayingMispronounced(false);
        return;
      }
      
      const audio = new Audio(data.publicUrl);
      audio.onended = () => setIsPlayingMispronounced(false);
      audio.onerror = () => setIsPlayingMispronounced(false);
      await audio.play();
    } catch (err) {
      console.error('Error playing mispronounced word audio:', err);
      setIsPlayingMispronounced(false);
    }
  };

  // Render score for single word
  const renderSingleWordScore = () => {
    if (!result) return null;
    
    const score = result.score;
    let label = '';
    let emoji = '';
    let gradientClass = '';
    let borderClass = '';
    let textClass = '';
    
    if (score <= 60) {
      label = 'Incorreto';
      emoji = '❌';
      gradientClass = 'bg-gradient-to-r from-red-50 to-rose-50';
      borderClass = 'border-red-200';
      textClass = 'text-red-700';
    } else if (score <= 65) {
      label = 'Quase lá';
      emoji = '🔶';
      gradientClass = 'bg-gradient-to-r from-amber-50 to-yellow-50';
      borderClass = 'border-amber-200';
      textClass = 'text-amber-700';
    } else {
      label = 'Correto';
      emoji = '✅';
      gradientClass = 'bg-gradient-to-r from-emerald-50 to-green-50';
      borderClass = 'border-emerald-200';
      textClass = 'text-emerald-700';
    }
    
    return (
      <div className={cn("px-6 py-4 rounded-xl flex items-center gap-3 border shadow-sm", gradientClass, borderClass)}>
        <span className="text-2xl">{emoji}</span>
        <div className="flex flex-col">
          <span className={cn("font-bold text-lg", textClass)}>{label}</span>
          <span className={cn("text-sm opacity-80", textClass)}>Pontuação: {score}/100</span>
        </div>
      </div>
    );
  };

  // Render score for phrase (multi-word)
  const renderPhraseScore = () => {
    if (!result) return null;
    
    const targetWords = currentItem.english.toLowerCase().split(/\s+/).map(w => w.replace(/[.,!?;:'"]/g, ''));
    const wordScoresMap = new Map<string, number>();
    
    // Build map of word scores
    result.wordScores?.forEach(ws => {
      wordScoresMap.set(ws.word.toLowerCase(), ws.score);
    });
    
    // Check for omitted words
    const spokenWords = result.wordScores?.map(ws => ws.word.toLowerCase()) || [];
    const omittedWords = targetWords.filter(w => 
      !spokenWords.some(sw => sw.includes(w) || w.includes(sw))
    );
    
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-center text-2xl md:text-3xl">
          {currentItem.english.split(/\s+/).map((word, idx) => {
            const cleanWord = word.toLowerCase().replace(/[.,!?;:'"]/g, '');
            const wordScore = wordScoresMap.get(cleanWord);
            const isBadPronunciation = wordScore !== undefined && wordScore < 50;
            const isGoodPronunciation = wordScore !== undefined && wordScore >= 50;
            
            return (
              <button 
                key={idx}
                onClick={() => playWordAudio(cleanWord, idx)}
                disabled={playingWordIndex !== null}
                className="flex flex-col items-center cursor-pointer hover:opacity-70 active:scale-95 transition-all"
              >
                <span
                  className={cn(
                    "font-semibold text-xl md:text-2xl",
                    isBadPronunciation && "text-amber-600",
                    isGoodPronunciation && "text-emerald-600"
                  )}
                >
                  {word}
                </span>
                {playingWordIndex === idx ? (
                  <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                ) : isBadPronunciation ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                ) : null}
              </button>
            );
          })}
        </div>
        
        {omittedWords.length > 0 && (
          <div className="flex items-center justify-center">
            <span className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
              ⚠️ Palavra{omittedWords.length > 1 ? 's' : ''} omitida{omittedWords.length > 1 ? 's' : ''}: <span className="font-bold">{omittedWords.join(', ')}</span>
            </span>
          </div>
        )}
      </div>
    );
  };

  if (!lesson || items.length === 0 || !currentItem) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No content found for this configuration.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[80vh] p-4 sm:p-6 relative">
      {/* Loading overlay during slide transition */}
      {isTransitioning && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Instruction Popup - only on first slide */}
      <PNLInstructionPopup
        isOpen={showInstructionPopup && currentIndex === 0}
        onClose={() => setShowInstructionPopup(false)}
        variant="recording"
      />

      {/* Main slide content */}
      <div className="flex-1 flex items-center justify-center">
        <Card key={currentIndex} className="w-full max-w-2xl shadow-lg animate-slide-in-fade">
          <CardContent className="p-8 sm:p-12">
            {/* Teacher flip button */}
            {isTeacherMode && (
              <div className="flex justify-center mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTeacherFlipped(!isTeacherFlipped)}
                  className="gap-2 bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <Eye className="h-4 w-4" />
                  {isTeacherFlipped ? "Back" : "See answer"}
                </Button>
              </div>
            )}

            {/* Teacher flipped view - simplified */}
            {isTeacherMode && isTeacherFlipped ? (
              <div className="flex flex-col items-center text-center space-y-6">
                {/* English text */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight">
                  {currentItem.english}
                </h1>

                {/* Portuguese translation */}
                <p className="text-xl sm:text-2xl text-muted-foreground">
                  ({currentItem.portuguese})
                </p>

                {/* Native audio only */}
                <div className="w-full max-w-sm bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 space-y-3 flex flex-col items-center">
                  <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                    <span className="text-lg">🗣️</span> O que um nativo falaria
                  </p>
                  <div className="flex gap-3">
                    <Button
                      size="icon"
                      onClick={handlePlayNative}
                      disabled={isPlayingNative || isPlayingNativeSlow || isPreloading}
                      className="h-11 w-11 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all"
                    >
                      {isPlayingNative ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      onClick={handlePlayNativeSlow}
                      disabled={isPlayingNative || isPlayingNativeSlow || isPreloading}
                      className="h-11 w-11 rounded-full bg-emerald-400 hover:bg-emerald-500 text-white shadow-md transition-all text-lg"
                    >
                      {isPlayingNativeSlow ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <span>🐢</span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Recording button */}
              <Button
                variant={isRecording ? "destructive" : result ? "outline" : "default"}
                size="lg"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                className={cn(
                  "w-24 h-24 rounded-full transition-all shadow-lg",
                  !isRecording && !result && "bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0",
                  isRecording && "ring-4 ring-red-300 animate-pulse bg-red-500 hover:bg-red-600",
                  result && "border-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : isRecording ? (
                  <Square className="h-8 w-8" />
                ) : result ? (
                  <RotateCcw className="h-10 w-10" />
                ) : (
                  <Mic className="h-10 w-10" />
                )}
              </Button>

              {/* English text */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight">
                {currentItem.english}
              </h1>

              {/* Portuguese translation */}
              <p className="text-xl sm:text-2xl text-muted-foreground">
                ({currentItem.portuguese})
              </p>

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center gap-3 text-indigo-600 bg-indigo-50 px-4 py-3 rounded-xl">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="font-medium">Analisando pronúncia...</span>
                </div>
              )}

              {/* Results section */}
              {result && !isLoading && (
                <div className="w-full space-y-5 pt-6 border-t-2 border-dashed border-muted">
                  {/* Extra word warning */}
                  {extraWordInfo && (
                    <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 px-5 py-3 rounded-xl shadow-sm">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <span className="font-semibold">Palavra extra: "{extraWordInfo.extraWord}"</span>
                    </div>
                  )}
                  
                  {/* Score display */}
                  <div className="flex justify-center">
                    {isMultiWord(currentItem.english) ? renderPhraseScore() : renderSingleWordScore()}
                  </div>

                  {/* Audio comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    {/* Student audio */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 space-y-3 flex flex-col items-center">
                      <p className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                        <span className="text-lg">🎤</span> O que você disse
                      </p>
                      <Button
                        size="icon"
                        onClick={playStudentAudio}
                        disabled={!studentAudioUrl || isPlayingStudent}
                        className="h-11 w-11 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-md transition-all"
                      >
                        {isPlayingStudent ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </Button>
                    </div>

                    {/* Native audio */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 space-y-3 flex flex-col items-center">
                      <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                        <span className="text-lg">🗣️</span> Pronúncia Nativa
                      </p>
                      <div className="flex gap-3">
                        <Button
                          size="icon"
                          onClick={handlePlayNative}
                          disabled={isPlayingNative || isPlayingNativeSlow || isPreloading}
                          className="h-11 w-11 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all"
                        >
                          {isPlayingNative ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Volume2 className="h-5 w-5" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          onClick={handlePlayNativeSlow}
                          disabled={isPlayingNative || isPlayingNativeSlow || isPreloading}
                          className="h-11 w-11 rounded-full bg-emerald-400 hover:bg-emerald-500 text-white shadow-md transition-all text-lg"
                        >
                          {isPlayingNativeSlow ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <span>🐢</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Mispronounced words slideshow */}
                  {getMispronouncedWords().length > 0 && (
                    <div ref={mispronouncedRef} className="flex items-center justify-center gap-4 mt-4">
                      {getMispronouncedWords().length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMispronouncedSlideIndex(prev => Math.max(0, prev - 1))}
                          disabled={mispronouncedSlideIndex === 0}
                          className="h-8 w-8"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                      )}
                      
                      <div className="flex items-center gap-4 bg-emerald-50 border-2 border-emerald-400 rounded-xl px-6 py-4">
                        <span className="text-xl font-semibold text-emerald-700">
                          {getMispronouncedWords()[mispronouncedSlideIndex]}
                        </span>
                        <Button
                          size="icon"
                          onClick={() => playMispronouncedWord(getMispronouncedWords()[mispronouncedSlideIndex])}
                          disabled={isPlayingMispronounced}
                          className="h-10 w-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all"
                        >
                          {isPlayingMispronounced ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Volume2 className="h-5 w-5" />
                          )}
                        </Button>
                      </div>

                      {getMispronouncedWords().length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMispronouncedSlideIndex(prev => Math.min(getMispronouncedWords().length - 1, prev + 1))}
                          disabled={mispronouncedSlideIndex === getMispronouncedWords().length - 1}
                          className="h-8 w-8"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      <div className="mt-4 mb-16 max-w-2xl mx-auto w-full">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / totalItems) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
});

PronunciationSlidesPage.displayName = 'PronunciationSlidesPage';

export default PronunciationSlidesPage;
