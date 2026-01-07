"use client";

import { useMemo } from "react";
import { TrajectoryStep } from "../types";
import { TreeNode } from "./TreeNode";
import { buildTree } from "../services/treeService";

interface TrajectoryTreeProps {
  /** The linear list of trajectory steps */
  steps: TrajectoryStep[];
  /** The final answer string, if available */
  finalAnswer?: string;
  /** Whether the trajectory execution is currently in progress */
  isLoading: boolean;
}

/**
 * Visualizes the RLM execution trajectory as a hierarchical tree.
 *
 * This component handles the transformation of a linear list of steps (with parent_ids)
 * into a recursive tree structure using the `buildTree` service. It then renders
 * the tree using the `TreeNode` component.
 *
 * @param props - Component props
 * @param props.steps - Array of trajectory steps
 * @param props.finalAnswer - Optional final answer to display at the end
 * @param props.isLoading - Loading state indicator
 * @returns The rendered tree visualization
 */
export function TrajectoryTree({
  steps,
  finalAnswer,
  isLoading,
}: TrajectoryTreeProps) {
  // Memoize tree construction to prevent unnecessary rebuilds
  const treeRoots = useMemo(() => buildTree(steps), [steps]);

  if (steps.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="space-y-2 pb-12">
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-black/40">
        {treeRoots.map((node, index) => (
          <TreeNode
            key={node.id ?? index}
            step={node}
            isLast={index === treeRoots.length - 1}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-2 text-zinc-400 animate-pulse">
            <div className="w-2 h-2 bg-zinc-400 rounded-full" />
            <span className="text-xs font-mono">Thinking...</span>
          </div>
        )}
      </div>

      {finalAnswer && (
        <div className="mt-8 border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-6">
          <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-4">
            Final Answer
          </h3>
          <div className="prose prose-sm dark:prose-invert max-w-none text-emerald-950 dark:text-emerald-50">
            {finalAnswer}
          </div>
        </div>
      )}
    </div>
  );
}
