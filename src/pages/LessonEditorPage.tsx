import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import LessonEditorWizard from '@/components/lesson-editor/LessonEditorWizard';

const LessonEditorPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get return path from state, default to /lessons
  const returnPath = location.state?.returnPath || '/lessons';

  const handleClose = () => {
    navigate(returnPath);
  };

  const handleSave = () => {
    // After saving, navigate back
    navigate(returnPath);
  };

  if (!lessonId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No lesson ID provided</p>
      </div>
    );
  }

  return (
    <LessonEditorWizard
      lessonId={lessonId}
      onClose={handleClose}
      onSave={handleSave}
    />
  );
};

export default LessonEditorPage;
