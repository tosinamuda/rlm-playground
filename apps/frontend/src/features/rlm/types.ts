/**
 * Supported types of execution steps in the RLM process.
 */
export type StepType =
  | 'code_execution'
  | 'llm_call'
  | 'sub_llm_call'
  | 'thinking'
  | 'lm_call_start'
  | 'lm_call_end'
  | 'tool_call_start'
  | 'tool_call_end'
  | 'module_start'
  | 'module_end'
  | 'complete'
  | 'error';

/**
 * Represents a single step in the RLM execution trajectory.
 */
export interface TrajectoryStep {
  /** Unique identifier for the step (optional for legacy/transient steps) */
  id?: number;
  /** The type of the step */
  type: StepType;
  /** The main content/input/code of the step */
  content?: string;
  /** The output/result of the step */
  output?: string;
  /** ID of the parent step, used for rebuilding the call tree */
  parent_id?: number | null;
  /** Child steps in the tree hierarchy (populated by tree builder) */
  children?: TrajectoryStep[];
  /** Additional metadata associated with the step */
  metadata?: {
    /** Model name used (if applicable) */
    model?: string;
    /** Tool name used (if applicable) */
    tool?: string;
    /** Execution time in seconds */
    time?: number;
    /** Token usage count */
    tokens?: number;
    /** Estimated cost */
    cost?: number;
    /** Arguments passed to the tool (stringified) */
    args?: string;
  };
}

/**
 * Represents a dataset available in the backend.
 */
export interface Dataset {
  /** The name/ID of the dataset */
  name: string;
  /** Description of the dataset */
  description?: string;
  /** The specific subset or split configuration */
  split: string;
}

/**
 * Represents a sample task from a dataset.
 */
export interface Sample {
  /** The task ID within the dataset */
  id: string;
  /** The context passage */
  context: string;
  /** The question or query */
  query: string;
  /** The ground truth answer(s) */
  answer?: string | string[];
}
