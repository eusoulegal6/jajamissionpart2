import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Languages, FileText, X, Check, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import tradutorIcon from "@/assets/tradutor-icon.png";
import { PT_TO_EN, RevertEntry } from "@/utils/uiEnglishDictionary";

interface TranslationOptionsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTranslator: () => void;
}

// Module-level state so the page can be reverted across popup open/close cycles.
let activeReverts: RevertEntry[] = [];
let observer: MutationObserver | null = null;
let isActive = false;

const EXCLUDE_SELECTOR = [
  "[data-teacher-ui]",
  "[data-lesson-content]",
  "[data-chat-content]",
  ".chat-message",
  ".lesson-page-content",
  ".prose",
  "script",
  "style",
  "noscript",
  "textarea",
  "input",
].join(",");

const translateNode = (root: Node): number => {
  if (!(root instanceof Element) && root.nodeType !== Node.DOCUMENT_NODE && root.nodeType !== Node.ELEMENT_NODE) {
    // Could be a text node directly
    if (root.nodeType === Node.TEXT_NODE) {
      const text = root as Text;
      const parent = text.parentElement;
      if (!parent || parent.closest(EXCLUDE_SELECTOR)) return 0;
      const original = text.textContent || "";
      const trimmed = original.trim();
      if (!trimmed) return 0;
      const translation = PT_TO_EN[trimmed];
      if (!translation) return 0;
      activeReverts.push({ node: text, original });
      text.textContent = original.replace(trimmed, translation);
      return 1;
    }
    return 0;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest(EXCLUDE_SELECTOR)) return NodeFilter.FILTER_REJECT;
      const text = node.textContent;
      if (!text) return NodeFilter.FILTER_REJECT;
      const trimmed = text.trim();
      if (!trimmed) return NodeFilter.FILTER_REJECT;
      return PT_TO_EN[trimmed] !== undefined
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  let count = 0;
  let node: Text | null;
  const found: Text[] = [];
  while ((node = walker.nextNode() as Text | null)) found.push(node);
  for (const t of found) {
    const original = t.textContent || "";
    const trimmed = original.trim();
    const translation = PT_TO_EN[trimmed];
    if (!translation) continue;
    activeReverts.push({ node: t, original });
    t.textContent = original.replace(trimmed, translation);
    count++;
  }
  return count;
};

const startObserver = () => {
  if (observer) return;
  observer = new MutationObserver((mutations) => {
    if (!isActive) return;
    // Debounce-ish: process synchronously but guard
    for (const m of mutations) {
      if (m.type === "childList") {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.TEXT_NODE) {
            try { translateNode(n); } catch {}
          }
        });
      } else if (m.type === "characterData" && m.target.nodeType === Node.TEXT_NODE) {
        try { translateNode(m.target); } catch {}
      }
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
};

const stopObserver = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
};

const applyEnglishMode = (): number => {
  if (isActive) {
    // Re-scan in case new content appeared
    return translateNode(document.body);
  }
  isActive = true;
  const count = translateNode(document.body);
  startObserver();
  return count;
};

const revertEnglishMode = (): number => {
  stopObserver();
  isActive = false;
  const count = activeReverts.length;
  // Revert in reverse order to handle any nested replacements safely
  for (let i = activeReverts.length - 1; i >= 0; i--) {
    const { node, original } = activeReverts[i];
    if (node.isConnected) node.textContent = original;
  }
  activeReverts = [];
  return count;
};

const TranslationOptionsPopup: React.FC<TranslationOptionsPopupProps> = ({
  isOpen,
  onClose,
  onOpenTranslator,
}) => {
  const { toast } = useToast();
  const [isApplied, setIsApplied] = useState(isActive);

  useEffect(() => {
    if (isOpen) setIsApplied(isActive);
  }, [isOpen]);

  const handleGoToTranslator = () => {
    onClose();
    onOpenTranslator();
  };

  const handleToggleEnglishMode = () => {
    if (isApplied) {
      const count = revertEnglishMode();
      window.dispatchEvent(new CustomEvent('toggle-english-ui', { detail: false }));
      setIsApplied(false);
      toast({
        title: "Reverted to Portuguese",
        description: `Restored ${count} UI elements.`,
      });
      onClose();
    } else {
      // Close immediately so the user sees the translated page
      onClose();
      // Trigger React-level translation (covers all t()-based labels everywhere)
      window.dispatchEvent(new CustomEvent('toggle-english-ui', { detail: true }));
      // Then walk the DOM for hardcoded PT strings on the current screen
      setTimeout(() => {
        const count = applyEnglishMode();
        setIsApplied(true);
        toast({
          title: "English mode enabled",
          description: `Translated ${count} extra UI elements. New screens auto-translate.`,
        });
      }, 50);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-white p-0" hideCloseButton data-teacher-ui>
        <div className="px-4 py-3 flex items-center justify-between border-b" data-teacher-ui>
          <DialogHeader className="flex-1">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <img src={tradutorIcon} alt="Translation" className="h-6 w-6" />
              Translation Options
            </DialogTitle>
          </DialogHeader>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-3" data-teacher-ui>
          <Button
            onClick={handleGoToTranslator}
            variant="outline"
            className="w-full h-auto py-4 flex items-center gap-4 justify-start hover:bg-blue-50 border-2"
          >
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <Languages className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-base">Go to Translator</div>
              <div className="text-sm text-muted-foreground">
                Open the full translator tool
              </div>
            </div>
          </Button>

          <Button
            onClick={handleToggleEnglishMode}
            variant="outline"
            className="w-full h-auto py-4 flex items-center gap-4 justify-start hover:bg-green-50 border-2"
          >
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
              {isApplied ? (
                <RotateCcw className="h-6 w-6 text-green-600" />
              ) : (
                <FileText className="h-6 w-6 text-green-600" />
              )}
            </div>
            <div className="text-left">
              <div className="font-semibold text-base">
                {isApplied ? "Revert to Portuguese" : "Switch UI to English"}
              </div>
              <div className="text-sm text-muted-foreground">
                {isApplied
                  ? "Restore original Portuguese labels"
                  : "Translate fixed UI labels everywhere (modes, buttons, menus, submenus)"}
              </div>
            </div>
            {isApplied && <Check className="h-5 w-5 text-green-600 ml-auto" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TranslationOptionsPopup;
