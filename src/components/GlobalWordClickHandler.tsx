import React, { useCallback, useEffect, useRef, useState } from "react";
import WordDefinitionModal from "@/components/WordDefinitionModal";
import { findMultiWordPhrases } from "@/utils/multiWordPhrases";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Global handler that makes any English word (or known multi-word phrase)
 * on the page clickable. On desktop, it also shows a hover highlight over
 * the word/phrase under the cursor — mirroring the "tenho dúvida em uma
 * palavra" mode, but always-on inside lesson pages and assistant chat
 * messages.
 *
 * No DOM mutation: we use caretPositionFromPoint / caretRangeFromPoint to
 * locate the text node + offset under the pointer, then render highlight
 * rectangles via getClientRects on a Range.
 */

const BASE_INTERACTIVE_SELECTORS = [
  "button",
  "a",
  "input",
  "textarea",
  "select",
  "label",
  "summary",
  "[role='button']",
  "[role='tab']",
  "[role='menuitem']",
  "[role='option']",
  "[role='switch']",
  "[role='checkbox']",
  "[role='radio']",
  "[contenteditable='true']",
  "[contenteditable='']",
];

const INTERACTIVE_SELECTOR = [
  ...BASE_INTERACTIVE_SELECTORS,
  "[data-no-word-click]",
  "[data-no-word-click] *",
].join(",");

// Used when a [data-word-clickable] override is in effect: do NOT treat
// data-no-word-click descendants as interactive, otherwise the override is
// neutralized by its own ancestor.
const INTERACTIVE_SELECTOR_OVERRIDE = BASE_INTERACTIVE_SELECTORS.join(",");


const NON_TEXT_HOVER_SELECTOR = [
  "img",
  "picture",
  "svg",
  "canvas",
  "video",
  "audio",
  "iframe",
  "object",
  "embed",
].join(",");

const WORD_REGEX = /[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'’-]*/g;

function getCaret(x: number, y: number): { node: Node; offset: number } | null {
  const docAny = document as any;
  if (typeof docAny.caretPositionFromPoint === "function") {
    const pos = docAny.caretPositionFromPoint(x, y);
    if (pos && pos.offsetNode) return { node: pos.offsetNode, offset: pos.offset };
  }
  if (typeof docAny.caretRangeFromPoint === "function") {
    const range: Range | null = docAny.caretRangeFromPoint(x, y);
    if (range && range.startContainer) return { node: range.startContainer, offset: range.startOffset };
  }
  return null;
}

function findWordAtOffset(text: string, offset: number): { word: string; start: number; end: number } | null {
  WORD_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = WORD_REGEX.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (offset >= start && offset <= end) {
      return { word: match[0], start, end };
    }
    if (start > offset) break;
  }
  return null;
}

/**
 * Resolve the target text + Range under the pointer. First try matching a
 * known multi-word phrase that contains the caret offset; otherwise fall
 * back to the single word at the offset.
 */
function resolveTargetAt(
  x: number,
  y: number
): { text: string; range: Range } | null {
  const caret = getCaret(x, y);
  if (!caret) return null;
  if (caret.node.nodeType !== Node.TEXT_NODE) return null;
  const textNode = caret.node as Text;
  const fullText = textNode.textContent || "";

  // Prefer multi-word phrase if caret falls inside one
  const phrases = findMultiWordPhrases(fullText);
  for (const p of phrases) {
    if (caret.offset >= p.start && caret.offset <= p.end) {
      const range = document.createRange();
      range.setStart(textNode, p.start);
      range.setEnd(textNode, p.end);
      return { text: fullText.substring(p.start, p.end), range };
    }
  }

  const word = findWordAtOffset(fullText, caret.offset);
  if (!word) return null;
  if (word.word.length < 2) return null;
  const range = document.createRange();
  range.setStart(textNode, word.start);
  range.setEnd(textNode, word.end);
  return { text: word.word, range };
}

/**
 * Verify that (x, y) actually falls inside rendered text for the range.
 * caretPositionFromPoint snaps to the nearest caret even when the pointer is
 * in empty space after the last word of a line, beside images, or in line-height
 * leading — this guard prevents hover from "sticking" to nearby words.
 */
function pointInsideRect(rect: DOMRect, x: number, y: number): boolean {
  if (rect.width <= 0 || rect.height <= 0) return false;

  const verticalInset = Math.min(Math.max(rect.height * 0.18, 2), rect.height * 0.35);
  return x >= rect.left && x <= rect.right && y >= rect.top + verticalInset && y <= rect.bottom - verticalInset;
}

function pointInRenderedText(range: Range, x: number, y: number): boolean {
  const hitElement = document.elementFromPoint(x, y);
  if (!hitElement || hitElement.closest(NON_TEXT_HOVER_SELECTOR)) return false;

  const textNode = range.startContainer;
  if (textNode !== range.endContainer || textNode.nodeType !== Node.TEXT_NODE) return false;
  const text = textNode.textContent || "";

  // Fast range check first, with no positive padding so empty space around the
  // word does not count as a hit.
  const rangeRects = Array.from(range.getClientRects());
  if (!rangeRects.some((rect) => pointInsideRect(rect, x, y))) return false;

  // Strict glyph/character check. Range rects can still include line-height
  // leading; checking non-space characters avoids triggering on line breaks,
  // images, or the space between words in multi-word phrases.
  for (let offset = range.startOffset; offset < range.endOffset; offset++) {
    if (!text[offset] || /\s/.test(text[offset])) continue;
    const charRange = document.createRange();
    charRange.setStart(textNode, offset);
    charRange.setEnd(textNode, offset + 1);
    const charRects = Array.from(charRange.getClientRects());
    charRange.detach();

    if (charRects.some((rect) => pointInsideRect(rect, x, y))) return true;
  }

  return false;
}

function isEligibleTarget(target: EventTarget | null): target is Element {
  if (!target || !(target instanceof Element)) return false;
  const clickable = target.closest("[data-word-clickable]");
  if (!clickable) return false;
  // Allow an explicit data-word-clickable element to override a data-no-word-click
  // ancestor (e.g. AI feedback page disables clicks globally but opts certain
  // text back in).
  const noClick = target.closest("[data-no-word-click]");
  if (noClick && !noClick.contains(clickable)) return false;
  // Re-check non-text/interactive within the clickable subtree only.
  // If a [data-word-clickable] override is active inside a [data-no-word-click]
  // ancestor, use a relaxed selector so the override is not self-defeating.
  const insideNoClick = !!noClick && noClick.contains(clickable);
  const selector = insideNoClick ? INTERACTIVE_SELECTOR_OVERRIDE : INTERACTIVE_SELECTOR;
  const interactive = target.closest(selector);
  if (interactive && clickable.contains(interactive)) return false;
  if (target.closest(NON_TEXT_HOVER_SELECTOR)) return false;
  return true;

}

interface HoverState {
  rects: DOMRect[];
}

const GlobalWordClickHandler: React.FC = () => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hover, setHover] = useState<HoverState | null>(null);
  const isMobile = useIsMobile();
  const lastKeyRef = useRef<string>("");

  const onClick = useCallback((e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.button !== 0) return;
    if (!isEligibleTarget(e.target)) return;

    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) return;

    const found = resolveTargetAt(e.clientX, e.clientY);
    if (!found) return;
    if (!pointInRenderedText(found.range, e.clientX, e.clientY)) return;

    setSelectedWord(found.text);
    setIsOpen(true);
    setHover(null);
  }, []);

  useEffect(() => {
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [onClick]);

  // Desktop-only: hover highlight
  useEffect(() => {
    if (isMobile) return;

    let rafId = 0;
    let lastX = 0;
    let lastY = 0;

    const update = () => {
      rafId = 0;
      if (!isEligibleTarget(document.elementFromPoint(lastX, lastY))) {
        if (hover) setHover(null);
        lastKeyRef.current = "";
        return;
      }
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 0) {
        if (hover) setHover(null);
        lastKeyRef.current = "";
        return;
      }
      const found = resolveTargetAt(lastX, lastY);
      if (!found || !pointInRenderedText(found.range, lastX, lastY)) {
        if (hover) setHover(null);
        lastKeyRef.current = "";
        return;
      }
      const rects = Array.from(found.range.getClientRects());
      const key = `${found.text}|${rects.map((r) => `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)}`).join(";")}`;
      if (key === lastKeyRef.current) return;
      lastKeyRef.current = key;
      setHover({ rects });
    };

    const onMove = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (rafId) return;
      rafId = window.requestAnimationFrame(update);
    };

    const onScroll = () => {
      if (!hover) return;
      setHover(null);
      lastKeyRef.current = "";
    };

    document.addEventListener("mousemove", onMove);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll, true);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isMobile, hover]);

  return (
    <>
      {hover && !isOpen && (
        <div className="pointer-events-none fixed inset-0 z-[9998]" aria-hidden>
          {hover.rects.map((r, i) => (
            <div
              key={i}
              style={{
                position: "fixed",
                left: r.left - 2,
                top: r.top - 1,
                width: r.width + 4,
                height: r.height + 2,
                backgroundColor: "rgba(59, 130, 246, 0.18)",
                borderRadius: 4,
                transition: "background-color 0.15s ease",
              }}
            />
          ))}
        </div>
      )}
      <WordDefinitionModal
        word={selectedWord}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setSelectedWord(null);
        }}
      />
    </>
  );
};

export default GlobalWordClickHandler;
