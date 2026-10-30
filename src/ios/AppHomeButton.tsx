import { ChevronLeft } from "lucide-react";

export function AppHomeButton({ onHome }: { onHome: () => void }) {
  return (
    <button
      type="button"
      className="app-home-button"
      aria-label="返回主屏幕"
      onClick={onHome}
    >
      <ChevronLeft size={15} aria-hidden="true" />
      主屏幕
    </button>
  );
}
