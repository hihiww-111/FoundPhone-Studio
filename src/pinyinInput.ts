export type PinyinCandidate = { word: string; consumed: number };
export function pinyinCandidates(dictionary: Record<string, string[]>, composition: string): PinyinCandidate[] {
 const key = composition.toLowerCase().replace(/'/g, "");
 for (let size = key.length; size > 0; size--) {
  const words = dictionary[key.slice(0, size)];
  if (words?.length) return words.map(word => ({ word, consumed: size }));
 }
 return [];
}
