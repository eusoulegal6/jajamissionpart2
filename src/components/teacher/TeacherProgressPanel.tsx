import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Copy, ExternalLink, Trash2, User, ChevronDown, ChevronRight, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTeacherStudentProgress } from '@/hooks/useTeacherStudents';
import { supabase } from '@/integrations/supabase/client';
import { useTeacherMode } from '@/contexts/TeacherModeContext';
import { generateShareableUrl } from '@/utils/shareUtils';


interface TeacherProgressPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const TeacherProgressPanel: React.FC<TeacherProgressPanelProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { progress, loading, deleteProgress, clearAllProgress } = useTeacherStudentProgress();
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const { setIsSaveProgressOpen } = useTeacherMode();

  // Group progress by student
  const progressByStudent = useMemo(() => {
    const grouped = progress.reduce((acc, progressItem) => {
      const studentId = progressItem.teacher_student_id;
      const studentName = progressItem.teacher_student.name;
      
      if (!acc[studentId]) {
        acc[studentId] = {
          student: { id: studentId, name: studentName },
          lessons: []
        };
      }
      
      acc[studentId].lessons.push(progressItem);
      return acc;
    }, {} as Record<string, { student: { id: string, name: string }, lessons: any[] }>);

    // Sort lessons by created_at for each student (newest first)
    Object.values(grouped).forEach(group => {
      group.lessons.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });

    return grouped;
  }, [progress]);

  const toggleStudentExpanded = (studentId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  const copyShareLink = async (progressItem: any) => {
    const { lesson_id, difficulty, current_page, total_pages } = progressItem || {};
    if (!lesson_id || !difficulty || !current_page || !total_pages) {
      toast({
        title: "Cannot copy link",
        description: "This record is incomplete (missing lesson or pages).",
        variant: "destructive"
      });
      return;
    }

    const link = generateShareableUrl(
      String(lesson_id),
      String(difficulty),
      Number(current_page) - 1
    );
    
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Link copied!",
        description: "The link has been copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy error",
        description: "Could not copy the link.",
        variant: "destructive"
      });
    }
  };

  const openShareLink = async (progressItem: any) => {
    try {
      const { lesson_id, difficulty, current_page, total_pages } = progressItem || {};
      if (!lesson_id || !difficulty || !current_page || !total_pages) {
        toast({
          title: "Error",
          description: "This record is incomplete (missing lesson or pages).",
          variant: "destructive"
        });
        return;
      }

      const target = generateShareableUrl(
        String(lesson_id),
        String(difficulty),
        Number(current_page) - 1
      );
      // Use full reload to correctly handle absolute URL
      window.location.href = target;
    } catch (err) {
      console.error('Error opening lesson:', err);
      toast({
        title: "Error",
        description: "Could not open the lesson.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProgress = (progressId: string) => {
    deleteProgress(progressId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Progress Panel
            </DialogTitle>
            <Button
              onClick={() => setIsSaveProgressOpen(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Progress
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <p>Loading progress...</p>
            </div>
          ) : progress.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No progress saved yet.</p>
              <p className="text-sm">Use the "Save student progress" button in lessons to start.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(progressByStudent).map(({ student, lessons }) => (
                <Card key={student.id} className="border">
                  <Collapsible 
                    open={expandedStudents.has(student.id)}
                    onOpenChange={() => toggleStudentExpanded(student.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {expandedStudents.has(student.id) ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{student.name}</CardTitle>
                              <p className="text-sm text-gray-600">
                                {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} saved
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-primary/5">
                            {lessons.length}
                          </Badge>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {lessons.map((progressItem) => (
                            <div key={progressItem.id} className="border rounded-lg p-4 bg-gray-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                   <h4 className="font-medium text-gray-900 mb-2">
                                     {progressItem.display_title || progressItem.lesson_title}
                                   </h4>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <Badge variant="secondary">
                                      Page {progressItem.current_page} of {progressItem.total_pages}
                                    </Badge>
                                    <span>
                                      Saved: {new Date(progressItem.created_at).toLocaleDateString('en-US')}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <Button
                                    onClick={() => copyShareLink(progressItem)}
                                    variant="outline"
                                    size="sm"
                                    disabled={!progressItem.lesson_id || !progressItem.difficulty || (progressItem.current_page ?? 0) <= 0 || (progressItem.total_pages ?? 0) <= 0}
                                    title={!progressItem.lesson_id || (progressItem.current_page ?? 0) <= 0 ? "Incomplete record" : "Copy link"}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() => openShareLink(progressItem)}
                                    variant="outline"
                                    size="sm"
                                    disabled={!progressItem.lesson_id || !progressItem.difficulty || (progressItem.current_page ?? 0) <= 0 || (progressItem.total_pages ?? 0) <= 0}
                                    title={!progressItem.lesson_id || (progressItem.current_page ?? 0) <= 0 ? "Incomplete record" : "Open lesson"}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteProgress(progressItem.id)}
                                    variant="destructive"
                                    size="sm"
                                    title="Remove"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherProgressPanel;