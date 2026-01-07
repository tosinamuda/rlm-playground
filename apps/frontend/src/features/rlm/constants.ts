import {
  Cpu,
  MessageSquare,
  Terminal,
  Zap,
  Play,
  CheckCircle,
  Wrench,
  AlertCircle,
  Box,
} from "lucide-react";
import React from "react";
import { StepType } from "./types";

/**
 * Mapping of step types to their corresponding Lucide icons.
 * Used in StepCard and TreeNode to visually represent the step type.
 */
export const STEP_ICONS: Record<StepType, React.ReactNode> = {
  // Fallback icon logic handled in components, but Code2 export kept for consistency if needed
  code_execution: React.createElement(Terminal, { className: "w-4 h-4" }),
  llm_call: React.createElement(MessageSquare, { className: "w-4 h-4" }),
  sub_llm_call: React.createElement(Zap, { className: "w-4 h-4" }),
  thinking: React.createElement(Cpu, { className: "w-4 h-4" }),
  lm_call_start: React.createElement(Play, { className: "w-4 h-4" }),
  lm_call_end: React.createElement(CheckCircle, { className: "w-4 h-4" }),
  tool_call_start: React.createElement(Wrench, { className: "w-4 h-4" }),
  tool_call_end: React.createElement(CheckCircle, { className: "w-4 h-4" }),
  module_start: React.createElement(Box, { className: "w-4 h-4" }),
  module_end: React.createElement(CheckCircle, { className: "w-4 h-4" }),
  complete: React.createElement(CheckCircle, { className: "w-4 h-4" }),
  error: React.createElement(AlertCircle, { className: "w-4 h-4" }),
};

/**
 * Human-readable labels for each step type.
 * Displayed in the UI badges/headers.
 */
export const STEP_LABELS: Record<StepType, string> = {
  code_execution: "REPL",
  llm_call: "LLM",
  sub_llm_call: "SUB-LLM",
  thinking: "Think",
  lm_call_start: "Prompt",
  lm_call_end: "Response",
  tool_call_start: "Tool Call",
  tool_call_end: "Tool Result",
  module_start: "Module",
  module_end: "Module Done",
  complete: "Complete",
  error: "Error",
};

/**
 * Color themes (background, border, text) for each step type.
 * Consistent across StepCard and Timeline.
 */
export const STEP_COLORS: Record<
  StepType,
  { bg: string; border: string; text: string }
> = {
  code_execution: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-900",
    text: "text-amber-700 dark:text-amber-300",
  },
  llm_call: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-900",
    text: "text-blue-700 dark:text-blue-300",
  },
  sub_llm_call: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-900",
    text: "text-purple-700 dark:text-purple-300",
  },
  thinking: {
    bg: "bg-zinc-50 dark:bg-zinc-900",
    border: "border-zinc-200 dark:border-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
  },
  lm_call_start: {
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    border: "border-indigo-200 dark:border-indigo-900",
    text: "text-indigo-700 dark:text-indigo-300",
  },
  lm_call_end: {
    bg: "bg-teal-50 dark:bg-teal-950/30",
    border: "border-teal-200 dark:border-teal-900",
    text: "text-teal-700 dark:text-teal-300",
  },
  tool_call_start: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-900",
    text: "text-orange-700 dark:text-orange-300",
  },
  tool_call_end: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-900",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  module_start: {
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    border: "border-cyan-200 dark:border-cyan-900",
    text: "text-cyan-700 dark:text-cyan-300",
  },
  module_end: {
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    border: "border-cyan-200 dark:border-cyan-900",
    text: "text-cyan-700 dark:text-cyan-300",
  },
  complete: {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-900",
    text: "text-green-700 dark:text-green-300",
  },
  error: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-900",
    text: "text-red-700 dark:text-red-300",
  },
};
