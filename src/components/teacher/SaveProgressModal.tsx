import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Check, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTeacherStudents } from '@/hooks/useTeacherStudents';
import { generateShareableUrl } from '@/utils/shareUtils';

interface SaveProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonTitle: string;
  currentPage: number;
  totalPages: number;
  difficulty: string;
}

const SaveProgressModal: React.FC<SaveProgressModalProps> = ({
  isOpen,
  onClose,
  lessonId,
  lessonTitle,
  currentPage,
  totalPages,
  difficulty
}) => {
  const { students, createStudent, saveStudentProgress } = useTeacherStudents();
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    let studentId = selectedStudentId;
    let studentName = '';

    // Create new student if needed
    if (isCreatingNew) {
      if (!newStudentName.trim()) {
        toast({
          title: "Name required",
          description: "Please enter the student's name.",
          variant: "destructive"
        });
        return;
      }
      
      const newStudent = await createStudent(newStudentName.trim());
      if (!newStudent) return;
      
      studentId = newStudent.id;
      studentName = newStudent.name;
    } else {
      if (!selectedStudentId) {
        toast({
          title: "Student required",
          description: "Please select a student.",
          variant: "destructive"
        });
        return;
      }
      
      const student = students.find(s => s.id === selectedStudentId);
      studentName = student?.name || '';
    }

    // Validate lesson data
    if (!lessonId || !difficulty || currentPage <= 0 || totalPages <= 0) {
      toast({
        title: "Missing data",
        description: "Lesson or page info is incomplete.",
        variant: "destructive"
      });
      return;
    }

    // Save progress to database
    const result = await saveStudentProgress(
      studentId,
      lessonId,
      lessonTitle,
      currentPage,
      totalPages,
      difficulty
    );

    if (!result) return;

    // Generate share link using the common helper
    const link = generateShareableUrl(
      lessonId,
      difficulty,
      Math.max(0, currentPage - 1)
    );
    setShareLink(link);
    setIsSaved(true);

    toast({
      title: "Progress saved!",
      description: `Progress saved for ${studentName}`,
    });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  const handleClose = () => {
    setSelectedStudentId('');
    setNewStudentName('');
    setIsCreatingNew(false);
    setIsSaved(false);
    setShareLink('');
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save Student Progress</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p><strong>Lesson:</strong> {lessonTitle}</p>
            <p><strong>Page:</strong> {currentPage} of {totalPages}</p>
          </div>
          
          {!isSaved ? (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setIsCreatingNew(false)}
                    variant={!isCreatingNew ? "default" : "outline"}
                    size="sm"
                  >
                    Select Existing
                  </Button>
                  <Button
                    onClick={() => setIsCreatingNew(true)}
                    variant={isCreatingNew ? "default" : "outline"}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New Student
                  </Button>
                </div>

                {isCreatingNew ? (
                  <div className="space-y-2">
                    <Label htmlFor="new-student-name">New Student Name</Label>
                    <Input
                      id="new-student-name"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="Enter student name"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="student-select">Select Student</Label>
                    <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button onClick={handleClose} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Progress
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center text-green-600 font-medium">
                ✓ Progress saved successfully!
              </div>
              
              <div className="space-y-2">
                <Label>Share link:</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="text-xs"
                  />
                  <Button onClick={copyLink} size="sm" variant="outline">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Student will be directed to this lesson page.
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleClose}>
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveProgressModal;