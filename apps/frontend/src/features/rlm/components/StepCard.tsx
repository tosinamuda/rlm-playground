"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Code2 } from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";
import { TrajectoryStep } from "../types";
import { STEP_ICONS, STEP_LABELS, STEP_COLORS } from "../constants";

interface StepCardProps {
  /** The trajectory step data to display */
  step: TrajectoryStep;
  /** The index of this step in the list (unused in display but good for keying) */
  index: number;
  /** Whether the card should be expanded by default */
  isActive?: boolean;
}

/**
 * Renders the header for a step card, including icon and metadata.
 *
 * @param props - Component props
 * @param props.step - The step data
 * @param props.isOpen - Whether the card is currently expanded
 * @param props.toggle - Function to toggle expansion state
 * @param props.colors - The color theme for this step type
 * @returns The rendered header
 */
function StepHeader({
  step,
  isOpen,
  toggle,
  colors,
}: {
  step: TrajectoryStep;
  isOpen: boolean;
  toggle: () => void;
  colors: { bg: string; border: string; text: string };
}) {
  // const icon = STEP_ICONS[step.type] || <Code2 className="w-4 h-4" />; // Unused

  const label = STEP_LABELS[step.type] || "STEP";

  return (
    <button
      type="button"
      onClick={toggle}
      className="w-full px-4 py-2 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            "text-[10px] font-bold tracking-widest uppercase shrink-0",
            colors.text
          )}
        >
          {label}
        </span>
        {step.metadata?.model && (
          <span className="text-[10px] text-zinc-500 font-mono truncate">
            {step.metadata.model}
          </span>
        )}
        {step.metadata?.tool && (
          <span className="text-[10px] text-zinc-500 font-mono truncate">
            {step.metadata.tool}
          </span>
        )}
        <div className="flex gap-3 text-[10px] text-zinc-400 font-mono shrink-0">
          {step.metadata?.time !== undefined && step.metadata.time > 0 && (
            <span>{step.metadata.time.toFixed(2)}s</span>
          )}
          {step.metadata?.tokens && <span>{step.metadata.tokens} tokens</span>}
        </div>
      </div>
      <ChevronDown
        className={cn(
          "w-4 h-4 text-zinc-400 transition-transform shrink-0",
          isOpen && "rotate-180"
        )}
      />
    </button>
  );
}

/**
 * Renders the content body of a step, handling code highlighting and specialized displays.
 *
 * @param props - Component props
 * @param props.step - The step data containing content to render
 * @returns The rendered body content or null
 */
function StepBody({ step }: { step: TrajectoryStep }) {
  if (step.type === "code_execution") {
    return (
      <Highlight
        theme={themes.github}
        code={step.content || ""}
        language="python"
      >
        {({ className, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={cn(
              className,
              "text-xs p-3 rounded-lg bg-zinc-50 dark:bg-black/20 overflow-x-auto font-mono"
            )}
            style={{
              whiteSpace: "pre-wrap",
              overflowWrap: "break-word",
            }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    );
  }

  if (step.type === "lm_call_start") {
    return (
      <div className="space-y-2">
        <div className="text-[10px] font-bold text-zinc-500 uppercase">
          Prompt Preview
        </div>
        <pre
          className="text-xs p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-200 font-mono overflow-x-auto max-h-64 whitespace-pre-wrap"
          style={{ overflowWrap: "break-word" }}
        >
          {step.content}
        </pre>
      </div>
    );
  }

  return (
    <p
      className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed"
      style={{ overflowWrap: "break-word" }}
    >
      {step.content}
    </p>
  );
}

/**
 * Renders the output section of a step.
 *
 * @param props - Component props
 * @param props.output - The output string to display
 * @returns The rendered output section
 */
function StepOutput({ output }: { output: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
        <span className="text-[9px] font-bold text-zinc-400">OUTPUT</span>
        <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <pre
        className="text-xs p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-mono overflow-x-auto border border-emerald-100/50 dark:border-emerald-900/50 max-h-64 whitespace-pre-wrap"
        style={{ overflowWrap: "break-word" }}
      >
        {output}
      </pre>
    </div>
  );
}

/**
 * Renders a single step in the RLM execution trajectory card.
 *
 * This component visualizes a single step in the reasoning chain, including its
 * type, status, content, metadata, and output. It supports expand/collapse
 * functionality to show/hide details.
 *
 * @param props - Component props
 * @param props.step - The trajectory step to render
 * @param props.index - The index of the step
 * @param props.isActive - Whether the step is initially active (expanded)
 * @returns The rendered StepCard component
 */
export function StepCard({ step, isActive = false }: StepCardProps) {
  // Simple state initialization
  const [isOpen, setIsOpen] = useState(isActive);

  const colors = STEP_COLORS[step.type] || STEP_COLORS.thinking;
  const icon = STEP_ICONS[step.type] || <Code2 className="w-4 h-4" />;
  const isEndStep = step.type.endsWith("_end");

  return (
    <div className="flex gap-4 group">
      {/* Timeline indicator */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center border shadow-sm z-10",
            isActive
              ? "bg-blue-500 border-blue-400 text-white"
              : step.type === "error"
              ? "bg-red-500 border-red-400 text-white"
              : `bg-white dark:bg-zinc-900 ${colors.border} ${colors.text}`
          )}
        >
          {icon}
        </div>
        <div className="w-px h-full bg-zinc-200 dark:bg-zinc-800 group-last:hidden" />
      </div>

      {/* Card content */}
      <div className="flex-1 pb-4 min-w-0">
        <div
          className={cn(
            "rounded-xl border shadow-sm overflow-hidden",
            colors.bg,
            colors.border
          )}
        >
          <StepHeader
            step={step}
            isOpen={isOpen}
            toggle={() => setIsOpen(!isOpen)}
            colors={colors}
          />

          {isOpen && (
            <div className="p-4 space-y-4 overflow-x-auto border-t border-zinc-100 dark:border-zinc-800/50 bg-white/50 dark:bg-black/20">
              <StepBody step={step} />

              {step.metadata?.args && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">
                    Arguments
                  </div>
                  <pre
                    className="text-xs p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 font-mono overflow-x-auto max-h-32 whitespace-pre-wrap"
                    style={{ overflowWrap: "break-word" }}
                  >
                    {step.metadata.args}
                  </pre>
                </div>
              )}

              {(step.output || isEndStep) && step.output && (
                <StepOutput output={step.output} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
