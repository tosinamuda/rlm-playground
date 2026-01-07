import { Dataset, Sample } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/**
 * Fetches the list of available RLM datasets/benchmarks from the backend.
 *
 * @returns Promise resolving to an array of Dataset objects
 */
export const fetchDatasets = async (): Promise<Dataset[]> => {
  const res = await fetch(`${API_URL}/datasets/list`);
  const data = await res.json();
  return data.datasets || [];
};

/**
 * Fetches a random sample task from the currently active dataset.
 *
 * @returns Promise resolving to a Sample object containing query and context
 */
export const fetchRandomSample = async (): Promise<Sample> => {
  const res = await fetch(`${API_URL}/datasets/sample`);
  return res.json();
};
