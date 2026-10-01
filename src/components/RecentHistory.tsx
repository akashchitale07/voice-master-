import React from 'react';
import { History, Play, Trash2, ArrowUpRight, Clock } from 'lucide-react';
import { HistoryItem } from '../types/tts';

interface RecentHistoryProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  onDeleteOne: (id: string) => void;
}

export const RecentHistory: React.FC<RecentHistoryProps> = ({
  history,
  onSelect,
  onClear,
  onDeleteOne,
}) => {
  if (history.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            हालिया इतिहास (Recent History)
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
            {history.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="text-xs text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 font-medium"
          title="Clear all recent history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      {/* History Items List */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {history.map((item) => (
          <div
            key={item.id}
            className="group p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 transition-all flex items-start justify-between gap-3"
          >
            <div
              className="flex-1 cursor-pointer"
              onClick={() => onSelect(item)}
            >
              <p className="font-hindi text-sm text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                {item.text}
              </p>
              
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span>•</span>
                <span>{item.voiceName}</span>
                <span>•</span>
                <span>{item.speed}x speed</span>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                title="Load into editor"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onDeleteOne(item.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
