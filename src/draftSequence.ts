export type DraftFrame = { text: string; delay: number };
/** Explicit Unicode frames keep an abandoned draft out of sent chat history. */
export function draftSequence(
  finalText: string,
  erasedText = "",
): DraftFrame[] {
  const type = (text: string): DraftFrame[] =>
    Array.from(text).map((_, i, a) => ({
      text: a.slice(0, i + 1).join(""),
      delay: 110,
    }));
  if (!erasedText) return type(finalText);
  const first = type(erasedText);
  first[first.length - 1].delay = 600;
  const letters = Array.from(erasedText);
  const erase = letters.map((_, i) => ({
    text: letters.slice(0, letters.length - i - 1).join(""),
    delay: 100,
  }));
  erase[erase.length - 1].delay = 2000;
  return [...first, ...erase, ...type(finalText)];
}
