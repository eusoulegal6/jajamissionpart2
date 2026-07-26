import React from "react";
import { LessonPageContext } from "@/types/lessonContext";
import { Card } from "@/components/ui/card";
import { MessageCircleQuestion } from "lucide-react";

interface LessonPagePreviewProps {
  lessonContext: LessonPageContext;
}

const LessonPagePreview: React.FC<LessonPagePreviewProps> = ({ lessonContext }) => {
  // Get the focused question or first question
  const focusedQuestion = lessonContext.focusedQuestionId 
    ? lessonContext.questions?.find(q => q.id === lessonContext.focusedQuestionId)
    : lessonContext.questions?.[0];

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 pointer-events-none select-none">
      <div className="space-y-3">
        {/* Page content */}
        {lessonContext.pageText && (
          <div className="text-sm text-foreground/80 line-clamp-4 leading-relaxed">
            {lessonContext.pageText.split('\n').map((para, idx) => (
              <p key={idx} className="mb-1.5">
                {para}
              </p>
            ))}
          </div>
        )}

        {/* Focused Question - clean display */}
        {focusedQuestion && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60 border border-primary/10">
            <MessageCircleQuestion className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-foreground">
              {focusedQuestion.text}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LessonPagePreview;
