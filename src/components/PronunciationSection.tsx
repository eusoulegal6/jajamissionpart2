import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mic, Square, Loader2 } from "lucide-react";

const SENTENCES = [
  // Basic
  "This is my house.",
  "I work from Monday to Friday.",
  "I would like a cup of coffee, please.",
  "Could you help me with this problem?",
  "I have been studying English for two years.",
  // Intermediate
  "The weather is really nice today.",
  "She bought three red apples at the store.",
  "Can you tell me how to get to the train station?",
  "I usually wake up at seven o'clock in the morning.",
  "My favorite movie is about a young wizard.",
  // Challenging sounds
  "The thirty-three thieves thought they thrilled the throne.",
  "She sells seashells by the seashore.",
  "Peter Piper picked a peck of pickled peppers.",
  "How much wood would a woodchuck chuck?",
  "I scream, you scream, we all scream for ice cream.",
  // Everyday phrases
  "Nice to meet you, my name is...",
  "Could I have the bill, please?",
  "What time does the meeting start?",
  "I'm sorry, I didn't understand that.",
  "Thank you very much for your help."
];

type MispronouncedWord = {
  word: string;
  issue: string;
  tip: string;
};

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
  mispronouncedWords: MispronouncedWord[];
  feedback: string;
  overallTip: string;
  wordScores?: WordScore[];
};

interface PronunciationSectionProps {
  onBack: () => void;
}

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const PronunciationSection: React.FC<PronunciationSectionProps> = ({ onBack }) => {
  const [selectedSentence, setSelectedSentence] = useState(SENTENCES[0]);
  const [engine, setEngine] = useState<"gemini-2.5" | "gemini-3">("gemini-2.5");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PronunciationResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const sendToApi = async (audioBase64: string, mimeType: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const functionName = engine === "gemini-3" ? "pronunciation-gemini-3" : "pronunciation-gemini";
      const { data, error: fnError } = await supabase.functions.invoke(functionName, {
        body: {
          audioBase64,
          mimeType,
          targetSentence: selectedSentence,
        },
      });

      if (fnError) {
        console.error("Error calling pronunciation function:", fnError);
        setError("Error calling pronunciation function. Please try again.");
        return;
      }

      setResult(data as PronunciationResult);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    setError(null);
    setResult(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }

          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const base64 = await blobToBase64(blob);
          await sendToApi(base64, "audio/webm");
        } catch (err) {
          console.error("Error processing recording:", err);
          setError("Error processing recording. Please try again.");
        } finally {
          setIsRecording(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone. Please check permissions.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSentenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSentence(e.target.value);
    setResult(null);
    setError(null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-[#f7f7f8] to-[#ffffff] border border-[#e8e8e8] rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-[#202123] mb-6">🎤 Pronunciation Practice</h1>

          {/* Engine Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#6e6e80] mb-2">
              Engine:
            </label>
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value === "gemini-3" ? "gemini-3" : "gemini-2.5")}
              className="w-full p-3 border border-[#e8e8e8] rounded-xl bg-white text-[#202123] focus:outline-none focus:ring-2 focus:ring-[#10a37f]"
            >
              <option value="gemini-2.5">Gemini 2.5 (current)</option>
              <option value="gemini-3">Gemini 3 (preview)</option>
            </select>
          </div>

          {/* Sentence Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#6e6e80] mb-2">
              Choose a sentence:
            </label>
            <select
              value={selectedSentence}
              onChange={handleSentenceChange}
              className="w-full p-3 border border-[#e8e8e8] rounded-xl bg-white text-[#202123] focus:outline-none focus:ring-2 focus:ring-[#10a37f]"
            >
              {SENTENCES.map((sentence, idx) => (
                <option key={idx} value={sentence}>
                  {sentence}
                </option>
              ))}
            </select>
          </div>

          {/* Target Sentence Display */}
          <div className="mb-6 p-4 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl">
            <p className="text-sm font-medium text-[#166534] mb-1">Read this sentence:</p>
            <p className="text-xl font-semibold text-[#14532d]">{selectedSentence}</p>
          </div>

          {/* Recording Button */}
          <div className="flex justify-center mb-6">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                disabled={isLoading}
                className="flex items-center gap-2 bg-[#10a37f] hover:bg-[#0d8567] text-white px-8 py-4 rounded-xl text-lg"
              >
                <Mic className="h-5 w-5" />
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl text-lg"
              >
                <Square className="h-5 w-5" />
                Stop Recording
              </Button>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-[#6e6e80] mb-6">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Analyzing pronunciation… ⏳</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Scores */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#f0f9ff] border border-[#bae6fd] rounded-xl text-center">
                  <p className="text-sm text-[#0369a1] font-medium">Score</p>
                  <p className="text-2xl font-bold text-[#0c4a6e]">{result.score ?? 0}/100</p>
                </div>
                <div className="p-4 bg-[#fef3c7] border border-[#fcd34d] rounded-xl text-center">
                  <p className="text-sm text-[#92400e] font-medium">Accuracy</p>
                  <p className="text-2xl font-bold text-[#78350f]">{result.accuracy ?? 0}/100</p>
                </div>
                <div className="p-4 bg-[#ede9fe] border border-[#c4b5fd] rounded-xl text-center">
                  <p className="text-sm text-[#5b21b6] font-medium">Fluency</p>
                  <p className="text-2xl font-bold text-[#4c1d95]">{result.fluency ?? 0}/100</p>
                </div>
                <div className="p-4 bg-[#fce7f3] border border-[#f9a8d4] rounded-xl text-center">
                  <p className="text-sm text-[#9d174d] font-medium">Intonation</p>
                  <p className="text-2xl font-bold text-[#831843]">{result.intonation ?? 0}/100</p>
                </div>
              </div>

              {/* Feedback */}
              {result.feedback && (
                <div className="p-4 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl">
                  <p className="text-sm font-medium text-[#166534] mb-1">Feedback:</p>
                  <p className="text-[#14532d]">{result.feedback}</p>
                </div>
              )}

              {/* Overall Tip */}
              {result.overallTip && (
                <div className="p-4 bg-[#fefce8] border border-[#fef08a] rounded-xl">
                  <p className="text-sm font-medium text-[#854d0e] mb-1">💡 Tip:</p>
                  <p className="text-[#713f12]">{result.overallTip}</p>
                </div>
              )}

              {/* Mispronounced Words - only show words with score <= 50 */}
              {result.mispronouncedWords && result.mispronouncedWords.length > 0 && result.wordScores && (() => {
                const lowScoreWords = result.wordScores.filter(w => w.score <= 50).map(w => w.word.toLowerCase());
                const filteredMispronounced = result.mispronouncedWords.filter(item => 
                  lowScoreWords.includes(item.word.toLowerCase())
                );
                return filteredMispronounced.length > 0 ? (
                  <div className="p-4 bg-[#fff7ed] border border-[#fed7aa] rounded-xl">
                    <p className="text-sm font-medium text-[#c2410c] mb-3">Words to practice:</p>
                    <ul className="space-y-3">
                      {filteredMispronounced.map((item, idx) => (
                        <li key={idx} className="p-3 bg-white rounded-lg border border-[#fed7aa]">
                          <p className="font-semibold text-[#9a3412]">"{item.word}"</p>
                          <p className="text-sm text-[#c2410c]">{item.issue}</p>
                          <p className="text-sm text-[#78350f] mt-1">
                            <span className="font-medium">Tip:</span> {item.tip}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              })()}

              {/* Word-by-word Scores - only show words with score <= 50 */}
              {result.wordScores && result.wordScores.length > 0 && (() => {
                const lowScoreWords = result.wordScores.filter(w => w.score <= 50);
                return lowScoreWords.length > 0 ? (
                  <div className="p-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl">
                    <p className="text-sm font-medium text-[#374151] mb-3">Word-by-word scores (needs improvement):</p>
                    <ul className="space-y-2">
                      {lowScoreWords.map((w, idx) => (
                        <li key={`${w.word}-${idx}`} className="p-3 bg-white rounded-lg border border-[#e5e7eb]">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#1f2937]">{w.word}</span>
                            <span className="font-bold text-[#b91c1c]">
                              {w.score}/100
                            </span>
                          </div>
                          {w.issue && (
                            <p className="text-sm text-[#b91c1c] mt-1">Issue: {w.issue}</p>
                          )}
                          {w.tip && (
                            <p className="text-sm text-[#6b7280] italic mt-1">Tip: {w.tip}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PronunciationSection;
