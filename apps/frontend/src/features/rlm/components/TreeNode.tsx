'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Code2 } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';
import { TrajectoryStep } from '../types';
import { STEP_ICONS, STEP_LABELS } from '../constants';

// Reusing colors somewhat differently for Tree nodes (simpler badges)
const TREE_COLORS: Record<string, string> = {
  code_execution: 'bg-violet-500 text-white',
  llm_call: 'bg-blue-500 text-white',
  sub_llm_call: 'bg-amber-500 text-white',
  thinking: 'bg-zinc-500 text-white',
  lm_call_start: 'bg-blue-400 text-white',
  lm_call_end: 'bg-blue-600 text-white',
  tool_call_start: 'bg-orange-500 text-white',
  tool_call_end: 'bg-orange-600 text-white',
  module_start: 'bg-purple-500 text-white',
  module_end: 'bg-purple-600 text-white',
  complete: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
};

/**
 * Props for the TreeNode component.
 */
interface TreeNodeProps {
  /** The trajectory step data for this node, including children */
  step: TrajectoryStep;
  /** Index primarily used for list rendering validation (optional) */
  index?: number;
  /** Whether this is the last node in the current list/level */
  isLast?: boolean;
  /** The current depth in the tree (0 for root) */
  depth?: number;
}

/**
 * Renders the content of a node, handling specialized displays for code.
 *
 * @param props - Component props
 * @param props.step - The step data
 * @param props.content - The text content to display
 * @returns The rendered content
 */
function NodeContent({ step, content }: { step: TrajectoryStep; content: string }) {
  if (step.type === 'code_execution') {
    return (
      <Highlight theme={themes.github} code={content} language="python">
        {({ className, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={cn(
              className,
              'text-xs p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 overflow-x-auto font-mono max-h-48'
            )}
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

  return (
    <div className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg max-h-48 overflow-y-auto whitespace-pre-wrap">
      {content}
    </div>
  );
}

/**
 * Renders a single node in the execution tree.
 *
 * This component recursively renders children if available. It supports expanding
 * and collapsing nodes to show/hide details.
 *
 * @param props - Component props
 * @param props.step - The step data including nested children
 * @param props.isLast - Whether this node is the last sibling
 * @param props.depth - Current tree depth
 * @returns The rendered tree node
 */
export function TreeNode({ step, isLast = false, depth = 0 }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const icon = STEP_ICONS[step.type] || <Code2 className="w-3.5 h-3.5" />;
  const label = STEP_LABELS[step.type] || 'Step';
  const colorClass = TREE_COLORS[step.type] || 'bg-zinc-500 text-white';

  const content = step.content || step.output || '';
  const preview = content.slice(0, 80) + (content.length > 80 ? '...' : '');

  const children = step.children;

  return (
    <div className="relative">
      {!isLast && depth === 0 && (
        <div className="absolute left-4 top-8 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800" />
      )}

      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-1 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors shrink-0"
        >
          <ChevronRight
            className={cn('w-4 h-4 text-zinc-400 transition-transform', isExpanded && 'rotate-90')}
          />
        </button>

        <div
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold shrink-0',
            colorClass
          )}
        >
          {icon}
          <span>{label}</span>
        </div>

        {!isExpanded && (
          <span className="text-xs text-zinc-500 font-mono truncate mt-1">{preview}</span>
        )}
      </div>

      {isExpanded && (
        <div className="ml-8 mt-2 mb-4 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4">
          {content && content !== step.output && (
            <div className="mb-3">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Content
              </div>
              <NodeContent step={step} content={content} />
            </div>
          )}

          {step.output && step.type !== 'tool_call_end' && (
            <div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                Output
              </div>
              <pre className="text-xs p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-mono overflow-x-auto max-h-32 whitespace-pre-wrap">
                {step.output}
              </pre>
            </div>
          )}

          {step.metadata && (
            <div className="flex gap-3 mt-2 text-[10px] text-zinc-400 font-mono">
              {step.metadata.time && <span>{step.metadata.time.toFixed(2)}s</span>}
              {step.metadata.tokens && <span>{step.metadata.tokens} tokens</span>}
              {step.metadata.cost && <span>${step.metadata.cost.toFixed(4)}</span>}
            </div>
          )}

          {children && children.length > 0 && (
            <div className="mt-4">
              {children.map((child, i) => (
                <TreeNode
                  key={child.id || i}
                  step={child}
                  isLast={i === children.length - 1}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
