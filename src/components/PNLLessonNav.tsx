import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { usePNLBookMode } from '@/hooks/usePNLBookMode';

interface PNLLessonNavProps {
  backTo: string;
  backLabel: string;
  nextTo?: string;
  nextLabel?: string;
}

/**
 * Navigation bar for PNL lesson pages.
 * In book mode, replaces normal navigation with a "Next in book" button.
 */
const PNLLessonNav: React.FC<PNLLessonNavProps> = ({ backTo, backLabel, nextTo, nextLabel }) => {
  const { isBookMode, advanceToNext } = usePNLBookMode();

  if (isBookMode) {
    return (
      <div className="bg-white border-t border-gray-200 p-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
          <button
            onClick={advanceToNext}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-sky-700 px-8 py-3 text-sm sm:text-base font-semibold text-white shadow hover:bg-sky-800 transition"
          >
            <BookOpen className="w-4 h-4" />
            Próximo no livro
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-gray-200 p-3">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between">
        <Link
          to={backTo}
          className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-slate-500 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow hover:bg-slate-600 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {backLabel}
        </Link>
        {nextTo && nextLabel && (
          <Link
            to={nextTo}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-sky-700 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow hover:bg-sky-800 transition"
          >
            {nextLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default PNLLessonNav;
