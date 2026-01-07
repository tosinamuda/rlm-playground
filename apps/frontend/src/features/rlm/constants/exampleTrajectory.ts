import type { TrajectoryStep } from "../types";

/**
 * Example trajectory data displayed on initial page load.
 *
 * Demonstrates the RLM's ability to decompose a task into manageable steps.
 */
export const EXAMPLE_STEPS: TrajectoryStep[] = [
  {
    id: 1,
    type: "thinking",
    content:
      "I need to analyze the provided dataset to understand its structure and content before proceeding.",
  },
  {
    id: 2,
    type: "tool_call_start",
    content: "execute_python",
    metadata: {
      tool: "execute_python",
      args: JSON.stringify({
        code: 'import pandas as pd\ndf = pd.read_csv("data.csv")\nprint(df.head())\nprint(f"Shape: {df.shape}")',
      }),
    },
  },
  {
    id: 3,
    type: "code_execution",
    content:
      'import pandas as pd\ndf = pd.read_csv("data.csv")\nprint(df.head())\nprint(f"Shape: {df.shape}")',
    output:
      "   id                timestamp  user_id   action  value\n0   1  2024-01-01 10:23:45      101    click   42.5\n1   2  2024-01-01 10:24:12      102   scroll   15.2\n...\nShape: (1000, 5)",
  },
  {
    id: 4,
    type: "tool_call_end",
    content: "execute_python",
  },
  {
    id: 5,
    type: "thinking",
    content:
      "The dataset contains 1000 rows with user interaction data. Now I'll compute summary statistics to identify patterns.",
  },
  {
    id: 6,
    type: "tool_call_start",
    content: "execute_python",
    metadata: {
      tool: "execute_python",
      args: JSON.stringify({
        code: 'stats = df.describe()\nprint(stats)\nprint(f"Unique users: {df.user_id.nunique()}")',
      }),
    },
  },
  {
    id: 7,
    type: "code_execution",
    content:
      'stats = df.describe()\nprint(stats)\nprint(f"Unique users: {df.user_id.nunique()}")',
    output:
      "              id      user_id       value\ncount   1000.00      1000.00     1000.00\nmean     500.50       174.23       42.51\nstd      288.82        71.35       28.64\n...\nUnique users: 247",
  },
  {
    id: 8,
    type: "tool_call_end",
    content: "execute_python",
  },
  {
    id: 9,
    type: "thinking",
    content:
      "I have analyzed the data. The dataset shows 247 unique users with a concentration of 'click' events. I can now formulate the final answer.",
  },
  {
    id: 10,
    type: "complete",
    content:
      "The dataset contains behavioral data from 247 unique users across 1000 events. The data shows a strong bias toward 'click' actions (68%), with an average event value of 42.5. This suggests user engagement is primarily driven by exploratory clicking behavior.",
  },
];

/**
 * Example final answer for the demo trajectory.
 */
export const EXAMPLE_FINAL_ANSWER =
  "The dataset contains behavioral data from 247 unique users across 1000 events. The data shows a strong bias toward 'click' actions (68%), with an average event value of 42.5. This suggests user engagement is primarily driven by exploratory clicking behavior.";
