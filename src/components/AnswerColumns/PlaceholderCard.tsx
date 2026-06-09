"use client";

interface Props {
  index: number;
  onClick: () => void;
}

export function PlaceholderCard({ index, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-1.5 min-h-[200px] h-full w-full transition-all hover:border-indigo-300 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 group"
    >
      <span className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-indigo-100 flex items-center justify-center text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 transition-all group-hover:scale-110">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </span>
      <span className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 font-medium">添加模型</span>
    </button>
  );
}
