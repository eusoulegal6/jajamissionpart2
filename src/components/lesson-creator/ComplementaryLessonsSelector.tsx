import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ComplementaryLessonsSelectorProps {
  destination: 'lessons' | 'content' | 'toefl';
  lessonCategory?: string;
  categoryId?: string;
  selectedLessonIds: string[];
  onChange: (lessonIds: string[]) => void;
}

interface LessonItem {
  id: string;
  title: string;
  description?: string;
  difficulty?: string;
}

const ComplementaryLessonsSelector: React.FC<ComplementaryLessonsSelectorProps> = ({
  destination,
  lessonCategory,
  categoryId,
  selectedLessonIds,
  onChange
}) => {
  const { learningLanguage } = useLanguage();
  const [availableLessons, setAvailableLessons] = useState<LessonItem[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<LessonItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Allow choosing source and filters independently from the wizard
  const [sourceType, setSourceType] = useState<'lessons' | 'content' | 'toefl'>(destination);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [contentCategories, setContentCategories] = useState<{ id: string; name: string }[]>([]);
  const [toeflCategories, setToeflCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedDetails, setSelectedDetails] = useState<LessonItem[]>([]);

  const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>(lessonCategory);
  const [selectedContentCategoryId, setSelectedContentCategoryId] = useState<string | undefined>(
    destination === 'content' ? categoryId : undefined
  );
  const [selectedToeflCategoryId, setSelectedToeflCategoryId] = useState<string | undefined>(
    destination === 'toefl' ? categoryId : undefined
  );

  // Sync defaults from wizard when props change
  useEffect(() => {
    setSourceType(destination);
    setSelectedDifficulty(lessonCategory);
    if (destination === 'content') {
      setSelectedContentCategoryId(categoryId);
      setSelectedToeflCategoryId(undefined);
    } else if (destination === 'toefl') {
      setSelectedToeflCategoryId(categoryId);
      setSelectedContentCategoryId(undefined);
    } else {
      setSelectedContentCategoryId(undefined);
      setSelectedToeflCategoryId(undefined);
    }
  }, [destination, lessonCategory, categoryId]);

  // Load filter options for the selected source
  useEffect(() => {
    const loadFilters = async () => {
      try {
        if (sourceType === 'lessons') {
          if (learningLanguage === 'es') {
            const { data, error } = await supabase
              .from('lessons_spanish')
              .select('difficulty');
            if (error) throw error;
            const unique = Array.from(new Set((data || []).map((r: any) => r.difficulty).filter(Boolean)));
            setDifficulties(unique.sort((a, b) => a.localeCompare(b)));
          } else {
            const [{ data: d1, error: e1 }, { data: d2, error: e2 }] = await Promise.all([
              supabase.from('lessons').select('difficulty'),
              supabase.from('book_lessons').select('difficulty'),
            ]);
            if (e1) throw e1;
            if (e2) throw e2;
            const unique = Array.from(
              new Set([...(d1 || []), ...(d2 || [])].map((r: any) => r.difficulty).filter(Boolean))
            );
            setDifficulties(unique.sort((a, b) => a.localeCompare(b)));
          }
        } else if (sourceType === 'content') {
          const { data, error } = await supabase
            .from('content_categories')
            .select('id, name, language')
            .eq('language', learningLanguage)
            .order('order');
          if (error) throw error;
          setContentCategories((data || []).map((c: any) => ({ id: c.id, name: c.name })));
        } else if (sourceType === 'toefl') {
          const { data, error } = await supabase
            .from('toefl_categories')
            .select('id, name, language')
            .eq('language', learningLanguage)
            .order('order_index');
          if (error) throw error;
          setToeflCategories((data || []).map((c: any) => ({ id: c.id, name: c.name })));
        }
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    };
    loadFilters();
  }, [sourceType, learningLanguage]);

  // Fetch items on filter change
  useEffect(() => {
    fetchAvailableLessons();
  }, [sourceType, selectedDifficulty, selectedContentCategoryId, selectedToeflCategoryId, learningLanguage]);

  // Apply text search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLessons(availableLessons);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredLessons(
        availableLessons.filter(lesson =>
          lesson.title.toLowerCase().includes(query) ||
          lesson.description?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, availableLessons]);

  // Load details for currently selected lessons across all sources
  useEffect(() => {
    const loadSelectedDetails = async () => {
      if (!selectedLessonIds || selectedLessonIds.length === 0) {
        setSelectedDetails([]);
        return;
      }
      try {
        const ids = selectedLessonIds;
        const baseSelect = 'id, title, description, difficulty';
        const queries: any[] = [];

        if (learningLanguage === 'es') {
          queries.push(
            supabase
              .from('lessons_spanish')
              .select(baseSelect)
              .in('id', ids)
              .then((r) => r)
          );
        } else {
          queries.push(
            supabase
              .from('lessons')
              .select(baseSelect)
              .in('id', ids)
              .then((r) => r),
            supabase
              .from('book_lessons')
              .select(baseSelect)
              .in('id', ids)
              .then((r) => r)
          );
        }
        // Content and TOEFL always possible
        queries.push(
          supabase
            .from('content_items')
            .select('id, title')
            .in('id', ids)
            .then((r) => r),
          supabase
            .from('toefl_items')
            .select('id, title')
            .in('id', ids)
            .then((r) => r)
        );

        const results = await Promise.all(queries);
        const all: LessonItem[] = [];
        results.forEach((res) => {
          if (res && !res.error && res.data) {
            res.data.forEach((row: any) => {
              all.push({
                id: row.id,
                title: row.title,
                description: row.description,
                difficulty: row.difficulty,
              });
            });
          }
        });

        // Deduplicate and keep order as in selectedLessonIds
        const map = new Map(all.map((it) => [it.id, it]));
        const ordered = ids.map((id) => map.get(id) || ({ id, title: id } as LessonItem));
        setSelectedDetails(ordered);
      } catch (err) {
        console.error('Error loading selected complementary lessons:', err);
      }
    };
    loadSelectedDetails();
  }, [selectedLessonIds, learningLanguage]);

  const fetchAvailableLessons = async () => {
    setIsLoading(true);
    try {
      if (sourceType === 'lessons') {
        if (learningLanguage === 'es') {
          const { data, error } = await supabase
            .from('lessons_spanish')
            .select('id, title, description, difficulty')
            .order('title');
          if (error) throw error;
          let list = (data || []) as LessonItem[];
          if (selectedDifficulty) list = list.filter((l) => l.difficulty === selectedDifficulty);
          setAvailableLessons(list);
        } else {
          const [{ data: d1, error: e1 }, { data: d2, error: e2 }] = await Promise.all([
            supabase.from('lessons').select('id, title, description, difficulty').order('title'),
            supabase.from('book_lessons').select('id, title, description, difficulty').order('title'),
          ]);
          if (e1) throw e1;
          if (e2) throw e2;
          let list: LessonItem[] = [...(d1 || []), ...(d2 || [])] as LessonItem[];
          if (selectedDifficulty) list = list.filter((l) => l.difficulty === selectedDifficulty);
          setAvailableLessons(list);
        }
      } else if (sourceType === 'content') {
        if (!selectedContentCategoryId) {
          setAvailableLessons([]);
        } else {
          // Fetch all items from chapters in the selected content category
          const { data: chapters, error: chaptersError } = await supabase
            .from('content_chapters')
            .select('id')
            .eq('category_id', selectedContentCategoryId);
          if (chaptersError) throw chaptersError;
          if (chapters && chapters.length > 0) {
            const chapterIds = chapters.map((ch: any) => ch.id);
            const { data, error } = await supabase
              .from('content_items')
              .select('id, title')
              .in('chapter_id', chapterIds)
              .order('title');
            if (error) throw error;
            setAvailableLessons((data || []) as LessonItem[]);
          } else {
            setAvailableLessons([]);
          }
        }
      } else if (sourceType === 'toefl') {
        if (!selectedToeflCategoryId) {
          setAvailableLessons([]);
        } else {
          const { data, error } = await supabase
            .from('toefl_items')
            .select('id, title, category_id')
            .eq('category_id', selectedToeflCategoryId)
            .order('title');
          if (error) throw error;
          setAvailableLessons((data || []) as LessonItem[]);
        }
      }
    } catch (error) {
      console.error('Error fetching available lessons:', error);
      setAvailableLessons([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLesson = (lessonId: string) => {
    if (selectedLessonIds.includes(lessonId)) {
      onChange(selectedLessonIds.filter(id => id !== lessonId));
    } else {
      onChange([...selectedLessonIds, lessonId]);
    }
  };

  // Get selected lesson details for display
  const selectedLessons = selectedDetails.length
    ? selectedDetails
    : selectedLessonIds.map((id) => ({ id, title: id } as LessonItem));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Lições Complementares
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-base font-medium">Adicionar Lições Relacionadas</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione lições que complementam este conteúdo. Elas serão exibidas ao estudante ao final da lição.
          </p>
        </div>

        {/* Currently Selected Lessons */}
        {selectedLessonIds.length > 0 && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
            <Label className="text-sm font-semibold">Lições Selecionadas ({selectedLessonIds.length})</Label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {selectedLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-2 bg-background rounded border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{lesson.title}</p>
                    {lesson.difficulty && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded inline-block mt-1">
                        {lesson.difficulty}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleLesson(lesson.id)}
                    className="ml-2 h-8 w-8 p-0"
                  >
                    <span className="sr-only">Remover</span>
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>Buscar em</Label>
            <Select
              value={sourceType}
              onValueChange={(v) => {
                setSourceType(v as 'lessons' | 'content' | 'toefl');
                setSelectedDifficulty(undefined);
                setSelectedContentCategoryId(undefined);
                setSelectedToeflCategoryId(undefined);
                setAvailableLessons([]);
                setFilteredLessons([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lessons">Lições</SelectItem>
                <SelectItem value="content">Conteúdo</SelectItem>
                <SelectItem value="toefl">TOEFL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sourceType === 'lessons' && (
            <div className="space-y-1">
              <Label>Categoria (dificuldade)</Label>
              <Select
                value={selectedDifficulty ?? 'all'}
                onValueChange={(v) => setSelectedDifficulty(v === 'all' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {difficulties.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {sourceType === 'content' && (
            <div className="space-y-1">
              <Label>Categoria de Conteúdo</Label>
              <Select
                value={selectedContentCategoryId ?? 'none'}
                onValueChange={(v) => setSelectedContentCategoryId(v === 'none' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  {contentCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {sourceType === 'toefl' && (
            <div className="space-y-1">
              <Label>Categoria TOEFL</Label>
              <Select
                value={selectedToeflCategoryId ?? 'none'}
                onValueChange={(v) => setSelectedToeflCategoryId(v === 'none' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  {toeflCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lições..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Results */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Adicionar Mais Lições</Label>
          <div className="max-h-[50vh] overflow-auto space-y-2 border rounded-lg p-3 bg-background">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Carregando lições...</p>
            ) : sourceType === 'content' && !selectedContentCategoryId ? (
              <p className="text-sm text-muted-foreground text-center py-4">Selecione uma categoria de conteúdo para listar as lições.</p>
            ) : sourceType === 'toefl' && !selectedToeflCategoryId ? (
              <p className="text-sm text-muted-foreground text-center py-4">Selecione uma categoria TOEFL para listar as lições.</p>
            ) : filteredLessons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma lição encontrada</p>
            ) : (
              filteredLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => handleToggleLesson(lesson.id)}
                >
                  <Checkbox
                    checked={selectedLessonIds.includes(lesson.id)}
                    onCheckedChange={() => handleToggleLesson(lesson.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{lesson.title}</p>
                    {lesson.description && (
                      <p className="text-xs text-muted-foreground mt-1">{lesson.description}</p>
                    )}
                    {lesson.difficulty && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded mt-1 inline-block">
                        {lesson.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplementaryLessonsSelector;
