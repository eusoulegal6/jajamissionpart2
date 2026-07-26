import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useFlashcards, FlashcardDeck } from "@/hooks/useFlashcards";
import Flashcard from "./Flashcard";
import FlashcardsPractice from "./FlashcardsPractice";

type Mode = "list" | "practice";
const CARDS_PER_PAGE = 9;

const FlashcardsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedDifficulty = location.state?.selectedDifficulty as string | null;
  const [mode, setMode] = React.useState<Mode>("list");
  const { decks, loading } = useFlashcards(selectedDifficulty ?? "");

  // State for current deck/chapter
  const [selectedDeckIdx, setSelectedDeckIdx] = React.useState(0);

  // Paging state for list mode
  const [page, setPage] = React.useState(1);

  // When decks or difficulty changes, reset to first deck
  React.useEffect(() => {
    setSelectedDeckIdx(0);
  }, [decks, selectedDifficulty]);

  React.useEffect(() => {
    if (!selectedDifficulty) {
      navigate("/complete-lessons");
    }
  }, [selectedDifficulty, navigate]);

  // Whenever mode changes or cards change, reset to first page
  React.useEffect(() => {
    setPage(1);
  }, [mode, selectedDeckIdx, decks]);

  const handleBack = () => {
    navigate("/complete-lessons", {
      state: { selectedDifficulty },
    });
  };

  const handleToggleMode = () => {
    setMode(mode === "list" ? "practice" : "list");
  };

  // Current deck/cards logic
  const hasDecks = Array.isArray(decks) && decks.length > 0;
  const currentDeck: FlashcardDeck | null = hasDecks ? decks[selectedDeckIdx] : null;
  const flashcards = currentDeck ? currentDeck.cards : [];
  const title = currentDeck ? currentDeck.title : "";

  // Pagination logic
  const totalPages = Math.ceil(flashcards.length / CARDS_PER_PAGE);
  const paginatedCards =
    mode === "list" ? flashcards.slice((page - 1) * CARDS_PER_PAGE, page * CARDS_PER_PAGE) : [];

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));

  // Deck/Chapter navigation UI
  const renderDeckTabs = () => {
    if (!hasDecks || decks.length < 2) return null;
    return (
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {decks.map((deck, idx) => (
          <Button
            key={deck.id}
            variant={selectedDeckIdx === idx ? "default" : "outline"}
            className={`font-semibold transition-colors duration-75 px-4 py-1 ${selectedDeckIdx === idx ? "bg-blue-600 text-white" : "bg-white text-blue-700 border-blue-200"}`}
            onClick={() => setSelectedDeckIdx(idx)}
          >
            {deck.title}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b px-4 py-6 flex items-center justify-between">
        <Button
          variant="outline"
          className="text-lg px-8 py-4 font-semibold flex items-center gap-2 text-blue-700 border-blue-300 hover:bg-blue-50"
          onClick={handleBack}
        >
          <ArrowLeft className="h-6 w-6" /> Voltar
        </Button>
        <div className="flex-1 text-center relative ml-0 sm:ml-0 pl-[10vw] sm:pl-0">
          <h1 className="text-2xl font-bold">Flashcards</h1>
        </div>
        <div className="w-40" />
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col p-4">
        {loading ? (
          <div className="py-20 text-center text-gray-500">
            Carregando flashcards...
          </div>
        ) : !hasDecks ? (
          <div className="py-20 text-center text-gray-500">
            Não há flashcards disponíveis para este nível.
          </div>
        ) : (
          <>
            {/* Deck/Chapter selector for multi-chapter (e.g. PNL) */}
            {renderDeckTabs()}
            {/* Removed deck/chapter title here */}
            <div className="mb-10 flex justify-end">
              <Button variant="secondary" className="font-semibold" onClick={handleToggleMode}>
                {mode === "list" ? "Praticar" : "Lista"}
              </Button>
            </div>
            {mode === "list" ? (
              <div>
                {/* Flashcards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {paginatedCards.map((card, idx) => (
                    <Flashcard
                      key={(page - 1) * CARDS_PER_PAGE + idx}
                      front={card.front}
                      back={card.back}
                      cardIndex={(page - 1) * CARDS_PER_PAGE + idx}
                    />
                  ))}
                </div>
                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <Button
                      variant="outline"
                      onClick={handlePrevPage}
                      disabled={page === 1}
                      className="px-4"
                    >
                      Anterior
                    </Button>
                    <span className="text-gray-700 font-semibold">
                      Página {page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={handleNextPage}
                      disabled={page === totalPages}
                      className="px-4"
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <FlashcardsPractice 
                  flashcards={flashcards} 
                  onBack={() => setMode("list")}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FlashcardsPage;
