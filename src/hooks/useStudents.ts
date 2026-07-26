import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { usePhoneAuth } from '@/contexts/PhoneAuthContext';

interface Student {
  id: string;
  name: string;
  created_at: string;
}

interface StudentProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  lesson_title: string;
  current_page: number;
  total_pages: number;
  created_at: string;
  student: {
    name: string;
  };
}

const supabase = createClient("https://mcuquzgpaeoqskesgcnx.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jdXF1emdwYWVvcXNrZXNnY254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODM1MjcsImV4cCI6MjA2MTY1OTUyN30.vGIcy1PzEQ_OE3PYEVQGK1XC1iPfLA6kWTVG2dpiWqI");

export const useStudents = () => {
  const { user } = usePhoneAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      // Use a simple query without complex type inference
      const result: any = await supabase
        .from('students')
        .select('id, name, created_at')
        .eq('phone_number', user.phone_number)
        .order('name');
        
      if (result.error) throw result.error;
      
      // Map the result to our interface
      const studentsData = (result.data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        created_at: row.created_at
      }));
      
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Erro ao carregar estudantes",
        description: "Não foi possível carregar a lista de estudantes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createStudent = async (name: string): Promise<Student | null> => {
    if (!user) return null;

    try {
      const studentData = {
        name: name.trim(),
        user_id: user.id,
        phone_number: user.phone_number
      };

      const result: any = await supabase
        .from('students')
        .insert([studentData])
        .select('id, name, created_at')
        .single();

      if (result.error) throw result.error;
      
      const newStudent: Student = {
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
      console.error('Error creating student:', error);
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
    totalPages: number
  ) => {
    if (!user) return null;

    try {
      const progressData = {
        student_id: studentId,
        lesson_id: lessonId,
        lesson_title: lessonTitle,
        current_page: currentPage,
        total_pages: totalPages,
        user_id: user.id,
        phone_number: user.phone_number
      };

      const result: any = await supabase
        .from('student_lesson_progress')
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
      console.error('Error saving progress:', error);
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

export const useStudentProgress = () => {
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    try {
      // Get current user's phone number from session
      const phoneUser = JSON.parse(localStorage.getItem('phoneUser') || '{}');
      if (!phoneUser.phone_number) {
        setLoading(false);
        return;
      }

      // First query to get progress records
      const progressResult: any = await supabase
        .from('student_lesson_progress')
        .select('*')
        .eq('phone_number', phoneUser.phone_number)
        .order('created_at', { ascending: false });

      if (progressResult.error) throw progressResult.error;

      // Get student names for each progress record
      const progressWithStudents: StudentProgress[] = [];
      
      for (const progressRecord of progressResult.data || []) {
        const studentResult: any = await supabase
          .from('students')
          .select('name')
          .eq('id', progressRecord.student_id)
          .single();
          
        progressWithStudents.push({
          ...progressRecord,
          student: {
            name: studentResult.data?.name || 'Unknown'
          }
        });
      }

      setProgress(progressWithStudents);
    } catch (error) {
      console.error('Error fetching progress:', error);
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
        .from('student_lesson_progress')
        .delete()
        .eq('id', progressId);

      if (result.error) throw result.error;
      
      setProgress(prev => prev.filter(p => p.id !== progressId));
      toast({
        title: "Progresso removido",
        description: "O progresso foi removido com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting progress:', error);
      toast({
        title: "Erro ao remover progresso",
        description: "Não foi possível remover o progresso.",
        variant: "destructive"
      });
    }
  };

  const clearAllProgress = async () => {
    try {
      // Get current user's phone number from session
      const phoneUser = JSON.parse(localStorage.getItem('phoneUser') || '{}');
      if (!phoneUser.phone_number) return;

      const result: any = await supabase
        .from('student_lesson_progress')
        .delete()
        .eq('phone_number', phoneUser.phone_number);

      if (result.error) throw result.error;
      
      setProgress([]);
      toast({
        title: "Todos os progressos removidos",
        description: "Todos os progressos foram removidos com sucesso.",
      });
    } catch (error) {
      console.error('Error clearing progress:', error);
      toast({
        title: "Erro ao limpar progressos",
        description: "Não foi possível remover todos os progressos.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  return {
    progress,
    loading,
    deleteProgress,
    clearAllProgress,
    refreshProgress: fetchProgress
  };
};