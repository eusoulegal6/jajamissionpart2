import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { usePhoneAuth } from '@/contexts/PhoneAuthContext';

interface TeacherStudent {
  id: string;
  name: string;
  created_at: string;
}

interface TeacherStudentProgress {
  id: string;
  teacher_student_id: string;
  lesson_id: string;
  lesson_title: string;
  current_page: number;
  total_pages: number;
  difficulty: string;
  created_at: string;
  display_title?: string;
  teacher_student: {
    name: string;
  };
}

const supabase = createClient("https://mcuquzgpaeoqskesgcnx.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jdXF1emdwYWVvcXNrZXNnY254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODM1MjcsImV4cCI6MjA2MTY1OTUyN30.vGIcy1PzEQ_OE3PYEVQGK1XC1iPfLA6kWTVG2dpiWqI");

export const useTeacherStudents = () => {
  const { user } = usePhoneAuth();
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const result: any = await supabase
        .from('teacher_students')
        .select('id, name, created_at')
        .eq('teacher_phone_number', user.phone_number)
        .order('name');
        
      if (result.error) throw result.error;
      
      setStudents(result.data || []);
    } catch (error) {
      console.error('Error fetching teacher students:', error);
      toast({
        title: "Erro ao carregar estudantes",
        description: "Não foi possível carregar a lista de estudantes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createStudent = async (name: string): Promise<TeacherStudent | null> => {
    if (!user) return null;

    try {
      const studentData = {
        name: name.trim(),
        teacher_phone_number: user.phone_number
      };

      const result: any = await supabase
        .from('teacher_students')
        .insert([studentData])
        .select('id, name, created_at')
        .single();

      if (result.error) throw result.error;
      
      const newStudent: TeacherStudent = {
        id: result.data.id,
        name: result.data.name,
        created_at: result.data.created_at
      };
      
      setStudents(prev => [...prev, newStudent]);
      toast({
        title: "Estudante criado",
        description: `${name} foi adicionado com sucesso.`,
      });
      
      return newStudent;
    } catch (error) {
      console.error('Error creating teacher student:', error);
      toast({
        title: "Erro ao criar estudante",
        description: "Não foi possível criar o estudante.",
        variant: "destructive"
      });
      return null;
    }
  };

  const saveStudentProgress = async (
    studentId: string,
    lessonId: string,
    lessonTitle: string,
    currentPage: number,
    totalPages: number,
    difficulty: string
  ) => {
    if (!user) return null;

    try {
      const progressData = {
        teacher_student_id: studentId,
        teacher_phone_number: user.phone_number,
        lesson_id: lessonId,
        lesson_title: lessonTitle,
        current_page: currentPage,
        total_pages: totalPages,
        difficulty: difficulty
      };

      const result: any = await supabase
        .from('teacher_student_progress')
        .insert([progressData])
        .select()
        .single();

      if (result.error) throw result.error;
      
      toast({
        title: "Progresso salvo",
        description: "O progresso do estudante foi salvo com sucesso.",
      });
      
      return result.data;
    } catch (error) {
      console.error('Error saving teacher student progress:', error);
      toast({
        title: "Erro ao salvar progresso",
        description: "Não foi possível salvar o progresso.",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user]);

  return {
    students,
    loading,
    createStudent,
    saveStudentProgress,
    refreshStudents: fetchStudents
  };
};

export const useTeacherStudentProgress = () => {
  const { user } = usePhoneAuth();
  const [progress, setProgress] = useState<TeacherStudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const progressResult: any = await supabase
        .from('teacher_student_progress')
        .select('*')
        .eq('teacher_phone_number', user.phone_number)
        .order('created_at', { ascending: false });

      if (progressResult.error) throw progressResult.error;

      // Get unique lesson IDs
      const lessonIds = [...new Set((progressResult.data || []).map((p: any) => p.lesson_id))];
      
      // Fetch actual lesson titles from lessons table
      const lessonsResult: any = await supabase
        .from('lessons')
        .select('id, title')
        .in('id', lessonIds);

      // Create a map of lesson IDs to display titles
      const lessonTitleMap = new Map(
        (lessonsResult.data || []).map((lesson: any) => [lesson.id, lesson.title])
      );

      const progressWithStudents: TeacherStudentProgress[] = [];
      
      for (const progressRecord of progressResult.data || []) {
        const studentResult: any = await supabase
          .from('teacher_students')
          .select('name')
          .eq('id', progressRecord.teacher_student_id)
          .single();
          
        progressWithStudents.push({
          ...progressRecord,
          display_title: lessonTitleMap.get(progressRecord.lesson_id) || progressRecord.lesson_title,
          teacher_student: {
            name: studentResult.data?.name || 'Unknown'
          }
        });
      }

      setProgress(progressWithStudents);
    } catch (error) {
      console.error('Error fetching teacher student progress:', error);
      toast({
        title: "Erro ao carregar progressos",
        description: "Não foi possível carregar os progressos salvos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteProgress = async (progressId: string) => {
    try {
      const result: any = await supabase
        .from('teacher_student_progress')
        .delete()
        .eq('id', progressId);

      if (result.error) throw result.error;
      
      setProgress(prev => prev.filter(p => p.id !== progressId));
      toast({
        title: "Progresso removido",
        description: "O progresso foi removido com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting teacher student progress:', error);
      toast({
        title: "Erro ao remover progresso",
        description: "Não foi possível remover o progresso.",
        variant: "destructive"
      });
    }
  };

  const clearAllProgress = async () => {
    if (!user) return;

    try {
      const result: any = await supabase
        .from('teacher_student_progress')
        .delete()
        .eq('teacher_phone_number', user.phone_number);

      if (result.error) throw result.error;
      
      setProgress([]);
      toast({
        title: "Todos os progressos removidos",
        description: "Todos os progressos foram removidos com sucesso.",
      });
    } catch (error) {
      console.error('Error clearing teacher student progress:', error);
      toast({
        title: "Erro ao limpar progressos",
        description: "Não foi possível remover todos os progressos.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchProgress();

    // Set up real-time subscription for new progress
    if (!user) return;

    const channel = supabase
      .channel('teacher_progress_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'teacher_student_progress',
          filter: `teacher_phone_number=eq.${user.phone_number}`
        },
        async (payload) => {
          console.log('New progress inserted:', payload);
          // Fetch the student name for the new progress
          const studentResult: any = await supabase
            .from('teacher_students')
            .select('name')
            .eq('id', payload.new.teacher_student_id)
            .single();

          // Fetch the actual lesson title
          const lessonResult: any = await supabase
            .from('lessons')
            .select('title')
            .eq('id', payload.new.lesson_id)
            .single();

          const newProgress: TeacherStudentProgress = {
            id: payload.new.id,
            teacher_student_id: payload.new.teacher_student_id,
            lesson_id: payload.new.lesson_id,
            lesson_title: payload.new.lesson_title,
            current_page: payload.new.current_page,
            total_pages: payload.new.total_pages,
            difficulty: payload.new.difficulty,
            created_at: payload.new.created_at,
            display_title: lessonResult.data?.title || payload.new.lesson_title,
            teacher_student: {
              name: studentResult.data?.name || 'Unknown'
            }
          };

          setProgress(prev => [newProgress, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    progress,
    loading,
    deleteProgress,
    clearAllProgress,
    refreshProgress: fetchProgress
  };
};