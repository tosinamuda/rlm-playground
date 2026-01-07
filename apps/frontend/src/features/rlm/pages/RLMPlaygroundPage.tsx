'use client';

import { useState } from 'react';
import { List, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRLMStream } from '../hooks/useRLMStream';
import { QueryForm, ThemeToggle, TrajectoryPanel } from '../components';

type ViewMode = 'timeline' | 'tree';

/**
 * Header component for the RLM Playground.
 * Renders the top navigation bar with branding and model info.
 */
function RLMHeader() {
  return (
    <nav className="shrink-0 border-b border-zinc-200 dark:border-zinc-900 bg-white/80 dark:bg-black/80 backdrop-blur-md">
      <div className="max-w-screen-2xl mx-auto px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-tight">RLM Playground</span>
          <span className="bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">
            Prototype
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

/**
 * Component to toggle between Tree and Timeline views.
 *
 * @param props - Component props
 * @param props.viewMode - Current active view mode ('timeline' | 'tree')
 * @param props.setViewMode - State setter for view mode
 * @param props.stepCount - Total number of steps executed
 * @param props.status - Current execution status
 */
function ViewToggle({
  viewMode,
  setViewMode,
  stepCount,
  status,
}: {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  stepCount: number;
  status: string;
}) {
  return (
    <div className="shrink-0 flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        Trajectory <span className="text-zinc-400 font-normal">({stepCount} steps)</span>
      </h2>

      <div className="flex items-center gap-4">
        {/* View Toggle */}
        {stepCount > 0 && (
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors',
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              )}
            >
              <List className="w-3.5 h-3.5" />
              Timeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors',
                viewMode === 'tree'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              )}
            >
              <GitBranch className="w-3.5 h-3.5" />
              Tree
            </button>
          </div>
        )}

        {/* Status indicator */}
        {status !== 'idle' && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                status === 'running'
                  ? 'bg-amber-500 animate-pulse'
                  : status === 'complete'
                    ? 'bg-emerald-500'
                    : 'bg-red-500'
              )}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main feature page for the RLM Playground.
 *
 * It orchestrates the entire RLM interaction, holding the state for the
 * stream execution and active view mode (Tree vs Timeline). It renders
 * the Query Interface on the left and Visualizations on the right.
 *
 * @returns The full page component
 */
export function RLMPlaygroundPage() {
  const { steps, finalAnswer, status, execute } = useRLMStream();
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');

  return (
    <main className="h-screen flex flex-col bg-zinc-50 dark:bg-black text-zinc-950 dark:text-white selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
      <RLMHeader />

      <div className="flex-1 overflow-hidden w-full h-full grid grid-cols-1 lg:grid-cols-12">
        {/* Left Col: Query Interface */}
        <div className="lg:col-span-5 flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-950/50 border-r border-zinc-200 dark:border-zinc-800">
          <div className="flex-1 min-h-0 flex flex-col p-6 lg:p-8">
            <div className="flex-1 min-h-0">
              <QueryForm onExecute={execute} isLoading={status === 'running'} />
            </div>
          </div>
        </div>

        {/* Right Col: Trajectory Visualization */}
        <div className="lg:col-span-7 flex flex-col h-full bg-zinc-50/50 dark:bg-black relative">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none" />

          <div className="flex-1 overflow-hidden flex flex-col p-6 lg:p-8 relative z-10">
            {steps.length > 0 && (
              <ViewToggle
                viewMode={viewMode}
                setViewMode={setViewMode}
                stepCount={steps.length}
                status={status}
              />
            )}

            <div className="flex-1 overflow-auto min-h-0 rounded-2xl border border-zinc-200 dark:border-zinc-800/50 bg-white/50 dark:bg-black/40 backdrop-blur-sm shadow-sm relative">
              <div className="absolute inset-0 overflow-auto p-4 sm:p-6 scroll-smooth">
                <TrajectoryPanel
                  steps={steps}
                  finalAnswer={finalAnswer}
                  viewMode={viewMode}
                  isLoading={status === 'running'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
