import { TrajectoryStep } from "../types";

export interface TreeNodeData extends TrajectoryStep {
  children: TreeNodeData[];
}

/**
 * Builds a hierarchical tree structure from a linear list of execution steps.
 * It uses the `parent_id` property of each step to reconstruct the call stack.
 *
 * Steps with no valid parent are considered root nodes.
 *
 * @param steps - Linear array of trajectory steps, potentially unsorted but ideally chronological
 * @returns Array of root nodes, each containing their nested children
 */
export const buildTree = (steps: TrajectoryStep[]): TreeNodeData[] => {
  const nodeMap = new Map<number, TreeNodeData>();
  const roots: TreeNodeData[] = [];

  // First pass: create all nodes locally wrapped with empty children array
  steps.forEach((step, index) => {
    // If no explicit ID is present, we fallback to index, though ID is preferred
    const id = step.id ?? index;
    nodeMap.set(id, { ...step, id, children: [] });
  });

  // Second pass: link children to their parents
  steps.forEach((step, index) => {
    const id = step.id ?? index;
    const node = nodeMap.get(id)!;

    if (step.parent_id != null && nodeMap.has(step.parent_id)) {
      // Has a valid parent in the current set - add as child
      nodeMap.get(step.parent_id)!.children.push(node);
    } else {
      // No parent or parent not found - treat as root
      roots.push(node);
    }
  });

  return roots;
};
