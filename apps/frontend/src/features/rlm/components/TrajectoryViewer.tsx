"use client";

import { useEffect, useRef } from "react";
import { TrajectoryStep } from "../types";
import { StepCard } from "./StepCard";

interface TrajectoryViewerProps {
  /** The linear list of trajectory steps */
  steps: TrajectoryStep[];
  /** The final answer string, if available */
  finalAnswer?: string;
  /** Whether the trajectory execution is currently in progress */
  isLoading: boolean;
}

/**
 * Visualizes the RLM execution trajectory as a linear timeline.
 *
 * This component renders each step as a `StepCard` in a vertical list. It automatically
 * scrolls to the bottom as new steps are added during loading.
 *
 * @param props - Component props
 * @param props.steps - Array of trajectory steps
 * @param props.finalAnswer - Optional final answer to display at the end
 * @param props.isLoading - Loading state indicator
 * @returns The rendered timeline visualization
 */
export function TrajectoryViewer({
  steps,
  finalAnswer,
  isLoading,
}: TrajectoryViewerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when steps change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps, finalAnswer, isLoading]);

  if (steps.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="space-y-8 pb-12 relative">
      {/* Timeline line background */}
      <div className="absolute left-4 top-4 bottom-4 w-px bg-zinc-100 dark:bg-zinc-800" />

      {steps.map((step, index) => (
        <StepCard
          key={step.id || index}
          step={step}
          index={index}
          isActive={true}
        />
      ))}

      {isLoading && (
        <div className="flex gap-4 ml-0.5">
          <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center animate-pulse z-10 border border-zinc-200 dark:border-zinc-700">
            <div className="w-2 h-2 bg-zinc-400 rounded-full" />
          </div>
          <div className="flex-1 py-1">
            <div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />

      {finalAnswer && (
        <div className="relative pl-12 mt-8">
          <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white z-10 shadow-lg shadow-emerald-500/20">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="rounded-2xl border-2 border-emerald-100 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-6">
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4">
              Final Answer
            </h3>
            <div className="prose prose-sm dark:prose-invert max-w-none text-emerald-900 dark:text-emerald-100 whitespace-pre-wrap font-medium">
              {finalAnswer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
