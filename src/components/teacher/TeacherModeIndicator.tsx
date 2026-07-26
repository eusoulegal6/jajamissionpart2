import React from 'react';
import { Badge } from '@/components/ui/badge';
import { GraduationCap } from 'lucide-react';
import { useTeacherMode } from '@/contexts/TeacherModeContext';

const TeacherModeIndicator: React.FC = () => {
  const { disableTeacherMode } = useTeacherMode();

  return (
    <div data-teacher-ui className="fixed top-4 right-4 z-[9999]">
      <Badge 
        variant="default" 
        className="bg-blue-600 text-white p-2 cursor-pointer hover:bg-blue-700 transition-colors"
        onClick={disableTeacherMode}
        title="Exit Teacher Mode"
      >
        <GraduationCap className="h-4 w-4" />
      </Badge>
    </div>
  );
};

export default TeacherModeIndicator;