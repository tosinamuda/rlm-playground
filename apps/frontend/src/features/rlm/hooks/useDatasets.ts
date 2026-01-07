import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchDatasets, fetchRandomSample } from '../api/datasets';
import { Dataset, Sample } from '../types';

/**
 * React Query hook to fetch and cache the list of available datasets.
 */
export function useDatasets() {
  return useQuery<Dataset[]>({
    queryKey: ['datasets'],
    queryFn: fetchDatasets,
  });
}

/**
 * React Query hook to fetch an initial sample on mount.
 * Uses staleTime: Infinity so it only fetches once.
 */
export function useSampleQuery() {
  return useQuery<Sample>({
    queryKey: ['sample', 'initial'],
    queryFn: fetchRandomSample,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * React Query mutation hook to fetch a new random sample.
 */
export function useSampleMutation() {
  return useMutation<Sample, Error>({
    mutationFn: fetchRandomSample,
  });
}
