export const MOBILE_PLAYER_QUERY = "(max-width: 600px), (max-height: 600px) and (pointer: coarse)";

export function edgeViewport(width: number, height: number) {
  const scale = Math.min(Math.max(1, width) / 393, Math.max(1, height) / 500);
  return { scale, width: width / scale, height: height / scale };
}
