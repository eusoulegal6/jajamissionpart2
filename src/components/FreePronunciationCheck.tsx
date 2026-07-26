import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mic, Square, Loader2, Volume2 } from "lucide-react";

type MispronouncedWord = {
  word: string;
  score: number;
  issue: string;
  tip: string;
};

type ExampleCorrection = {
  original: string;
  corrected: string;
  tip: string;
};

type FreePronunciationResult = {
  transcript: string;
  overallScore: number;
  pronunciation: number;
  fluency: number;
  intonation: number;
  clarity: number;
  levelEstimate: string;
  issues: string[];
  tips: string[];
  mispronouncedWords: MispronouncedWord[];
  exampleCorrections: ExampleCorrection[];
};

interface FreePronunciationCheckProps {
  onBack: () => void;
}

const FreePronunciationCheck: React.FC<FreePronunciationCheckProps> = ({ onBack }) => {
  const [topic, setTopic] = useState<string>("Talk for about 30–60 seconds about your day in English.");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FreePronunciationResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

  const startRecording = async () => {
    setError(null);
    setResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const mimeType = blob.type || "audio/webm";
        const audioBase64 = await blobToBase64(blob);
        await sendToApi(audioBase64, mimeType);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Error starting recording:", err);
      setError("Could not access microphone. Please check your permissions.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const sendToApi = async (audioBase64: string, mimeType: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("free-pronunciation-check", {
        body: {
          audioBase64,
          mimeType,
          context: topic,
        },
      });

      if (invokeError) {
        console.error("Error from free-pronunciation-check:", invokeError);
        setError("Failed to analyze your speech. Please try again.");
        return;
      }

      setResult(data as FreePronunciationResult);
    } catch (err) {
      console.error("Exception calling free-pronunciation-check:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-50 border-emerald-200";
    if (score >= 60) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">Free pronunciation check</h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Description */}
          <Card className="bg-white border shadow-sm">
            <CardContent className="p-6">
              <p className="text-gray-600 text-center">
                Speak freely in English and get feedback on your pronunciation, fluency, and intonation.
              </p>
            </CardContent>
          </Card>

          {/* Topic Input */}
          <Card className="bg-white border shadow-sm">
            <CardContent className="p-6 space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Question / Topic (optional)
              </label>
              <Textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a topic or question..."
                className="min-h-[80px] resize-none"
              />
            </CardContent>
          </Card>

          {/* Current Topic Display */}
          <Card className="bg-teal-50 border border-teal-200 shadow-sm">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-teal-700 font-medium mb-2">Your topic:</p>
              <p className="text-lg text-teal-900 font-semibold">{topic || "Free talk"}</p>
            </CardContent>
          </Card>

          {/* Recording Controls */}
          <div className="flex flex-col items-center gap-4">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                disabled={isLoading}
                size="lg"
                className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg"
              >
                <Mic className="h-8 w-8" />
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                size="lg"
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse"
              >
                <Square className="h-8 w-8" />
              </Button>
            )}

            <p className="text-sm text-gray-500">
              {isRecording ? "Tap to stop recording" : "Tap to start recording"}
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <Card className="bg-blue-50 border border-blue-200">
              <CardContent className="p-6 flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-blue-700 font-medium">Analyzing your speech… ⏳</span>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card className="bg-red-50 border border-red-200">
              <CardContent className="p-6">
                <p className="text-red-700 text-center">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Scores Section */}
              <Card className="bg-white border shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 text-center">Your Scores</h3>
                  
                  {/* Overall Score */}
                  <div className={`p-4 rounded-xl border text-center ${getScoreBg(result.overallScore)}`}>
                    <p className="text-sm text-gray-600 mb-1">Overall Score</p>
                    <p className={`text-4xl font-bold ${getScoreColor(result.overallScore)}`}>
                      {result.overallScore}/100
                    </p>
                  </div>

                  {/* Individual Scores */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Pronunciation", value: result.pronunciation },
                      { label: "Fluency", value: result.fluency },
                      { label: "Intonation", value: result.intonation },
                      { label: "Clarity", value: result.clarity },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`p-3 rounded-lg border text-center ${getScoreBg(item.value)}`}
                      >
                        <p className="text-xs text-gray-600">{item.label}</p>
                        <p className={`text-xl font-bold ${getScoreColor(item.value)}`}>
                          {item.value}/100
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Level Estimate */}
                  <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl text-center">
                    <p className="text-sm text-indigo-600 mb-1">Estimated Level</p>
                    <p className="text-2xl font-bold text-indigo-700">{result.levelEstimate}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Transcript */}
              <Card className="bg-white border shadow-sm">
                <CardContent className="p-6 space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Transcript (what you said)</h3>
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <p className="text-gray-700 italic">"{result.transcript}"</p>
                  </div>
                </CardContent>
              </Card>

              {/* Mispronounced Words */}
              {result.mispronouncedWords && result.mispronouncedWords.length > 0 && (
                <Card className="bg-white border shadow-sm">
                  <CardContent className="p-6 space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Mispronounced Words</h3>
                    <ul className="space-y-3">
                      {result.mispronouncedWords.map((w, idx) => (
                        <li key={`${w.word}-${idx}`} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-orange-800">{w.word}</span>
                            {typeof w.score === "number" && !Number.isNaN(w.score) && (
                              <span className="text-sm text-orange-600">– {w.score}/100</span>
                            )}
                          </div>
                          {w.issue && (
                            <div className="text-sm text-gray-700 mt-1">
                              <span className="font-medium">Issue:</span> {w.issue}
                            </div>
                          )}
                          {w.tip && (
                            <div className="text-sm text-gray-600 italic mt-1">
                              <span className="font-medium not-italic">Tip:</span> {w.tip}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Issues */}
              {result.issues && result.issues.length > 0 && (
                <Card className="bg-white border shadow-sm">
                  <CardContent className="p-6 space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Main Issues</h3>
                    <ul className="space-y-2">
                      {result.issues.map((issue, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span className="text-gray-700">{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Tips */}
              {result.tips && result.tips.length > 0 && (
                <Card className="bg-white border shadow-sm">
                  <CardContent className="p-6 space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Tips to Improve</h3>
                    <ul className="space-y-2">
                      {result.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-500 mt-1">💡</span>
                          <span className="text-gray-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Example Corrections */}
              {result.exampleCorrections && result.exampleCorrections.length > 0 && (
                <Card className="bg-white border shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Example Corrections</h3>
                    <div className="space-y-4">
                      {result.exampleCorrections.map((correction, idx) => (
                        <div key={idx} className="bg-gray-50 border rounded-lg p-4 space-y-2">
                          <div>
                            <span className="text-xs font-medium text-gray-500">Original:</span>
                            <p className="text-red-600 line-through">{correction.original}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">Better:</span>
                            <p className="text-emerald-600 font-medium">{correction.corrected}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">Tip:</span>
                            <p className="text-gray-600 text-sm">{correction.tip}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Try Again Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => setResult(null)}
                  variant="outline"
                  className="px-8"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreePronunciationCheck;
