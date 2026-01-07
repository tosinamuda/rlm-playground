'use client';

import { Database } from 'lucide-react';
import { TrajectoryViewer, TrajectoryTree } from '.';
import type { TrajectoryStep } from '../types';

type ViewMode = 'timeline' | 'tree';

interface TrajectoryPanelProps {
  steps: TrajectoryStep[];
  finalAnswer?: string;
  viewMode: ViewMode;
  isLoading: boolean;
}

/**
 * Empty state shown when no steps have been executed yet.
 */
function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-3 max-w-md px-6">
        <div className="text-zinc-400 dark:text-zinc-600 mb-4">
          <Database className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Ready to Execute</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-balance leading-relaxed">
          A sample dataset has been loaded. Click &ldquo;Run Execution&rdquo; to watch the RLM
          decompose the task into manageable steps.
        </p>
      </div>
    </div>
  );
}

/**
 * Panel component that renders the appropriate trajectory visualization
 * based on the current view mode.
 */
export function TrajectoryPanel({ steps, finalAnswer, viewMode, isLoading }: TrajectoryPanelProps) {
  if (steps.length === 0) {
    return <EmptyState />;
  }

  if (viewMode === 'tree') {
    return <TrajectoryTree steps={steps} finalAnswer={finalAnswer} isLoading={isLoading} />;
  }

  return <TrajectoryViewer steps={steps} finalAnswer={finalAnswer} isLoading={isLoading} />;
}
