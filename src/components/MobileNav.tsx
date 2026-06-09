"use client";

interface Props {
  activeTab: "models" | "chat" | "results";
  onTabChange: (tab: "models" | "chat" | "results") => void;
  hasResults: boolean;
}

export function MobileNav({ activeTab, onTabChange, hasResults }: Props) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-t-gray-700 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)]">
      <button
        type="button"
        onClick={() => onTabChange("models")}
        className={`flex flex-col items-center py-2 px-4 gap-0.5 transition-colors ${
          activeTab === "models" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
        <span className="text-[10px] font-medium">模型</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange("chat")}
        className={`flex flex-col items-center py-2 px-4 gap-0.5 transition-colors ${
          activeTab === "chat" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="text-[10px] font-medium">对话</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange("results")}
        className={`relative flex flex-col items-center py-2 px-4 gap-0.5 transition-colors ${
          activeTab === "results" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span className="text-[10px] font-medium">评分</span>
        {hasResults && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />}
      </button>
    </nav>
  );
}
