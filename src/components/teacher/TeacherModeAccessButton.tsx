import { useState } from "react";
import { GraduationCap } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  onConfirm: () => void;
}

export default function TeacherModeAccessButton({ onConfirm }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop-only floating icon */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Entrar no modo professor"
        className="hidden md:flex fixed top-4 right-6 z-[9998] h-11 w-11 items-center justify-center rounded-full bg-sky-600 text-white shadow-md ring-1 ring-sky-700/30 transition hover:bg-sky-700 hover:scale-105"
      >
        <GraduationCap className="h-5 w-5" />
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Entrar no modo professor?
              <span className="block text-sm font-normal text-muted-foreground mt-1">
                Enter teacher mode?
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Recomendado apenas para professores.
              <span className="block mt-1 italic">Recommended for teachers only.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar / Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              Entrar / Enter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
