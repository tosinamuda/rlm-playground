'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Play, Shuffle, Database, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSampleQuery, useSampleMutation } from '../hooks/useDatasets';
import { Editor } from './Editor';

interface FormData {
  query: string;
  context: string;
  enableSubLlm: boolean;
}

interface QueryFormProps {
  onExecute: (query: string, context: string, enableSubLlm: boolean) => void;
  isLoading: boolean;
}

/**
 * Loading skeleton shown while initial sample is being fetched.
 */
function LoadingSkeleton() {
  return (
    <div className="flex flex-col h-full min-h-0 animate-pulse">
      <div className="shrink-0 mb-4">
        <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
        <div className="h-24 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
      </div>
      <div className="flex-1 flex flex-col min-h-0 mb-4">
        <div className="flex justify-between mb-2">
          <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>
        <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
      </div>
      <div className="shrink-0 flex items-center gap-3 mb-4">
        <div className="flex-1 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        <div className="w-28 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
      </div>
      <div className="shrink-0 h-11 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      <div className="text-center text-xs text-zinc-400 mt-3">Loading sample data...</div>
    </div>
  );
}

/**
 * Form interface for submitting RLM queries.
 */
export function QueryForm({ onExecute, isLoading }: QueryFormProps) {
  // Initial sample fetch via React Query
  const { data: initialSample, isLoading: isSampleLoading } = useSampleQuery();

  // Mutation for loading new random samples
  const sampleMutation = useSampleMutation();
  const [contextLength, setContextLength] = useState(0);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<FormData>({
    defaultValues: {
      query: '',
      context: '',
      enableSubLlm: true,
    },
    mode: 'onChange',
  });

  // Watch form values
  const query = watch('query');
  const context = watch('context');

  // Populate form when initial sample loads
  useEffect(() => {
    if (initialSample && query === '' && context === '') {
      setValue('query', initialSample.query || '', { shouldValidate: true });
      setValue('context', initialSample.context || '', { shouldValidate: true });
      setContextLength(initialSample.context?.length || 0);
    }
  }, [initialSample, setValue, query, context]);

  const onSubmit = (data: FormData) => {
    onExecute(data.query, data.context, data.enableSubLlm);
  };

  const loadRandomSample = async () => {
    const result = await sampleMutation.mutateAsync();
    if (result && !('error' in result)) {
      setValue('query', result.query || '', { shouldValidate: true });
      setValue('context', result.context || '', { shouldValidate: true });
      setContextLength(result.context?.length || 0);
    }
  };

  // Show skeleton during initial load OR when fetching a new sample
  if (isSampleLoading || sampleMutation.isPending) {
    return <LoadingSkeleton />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full min-h-0">
      {/* Query Input */}
      <div className="shrink-0 mb-4">
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2 block">
          Your Input
        </label>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-linear-to-r from-indigo-500 to-purple-500 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur-sm" />
          <div className="relative">
            <Controller
              name="query"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Editor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="e.g., Based on the passage, which statement is correct?"
                  minHeight="64px"
                  maxHeight="128px"
                  className="bg-white dark:bg-zinc-950 border-transparent shadow-sm rounded-xl!"
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Context Input */}
      <div className="flex-1 flex flex-col min-h-0 mb-4">
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center justify-between mb-2">
          <span>Additional Context</span>
          <span className="text-[10px] text-zinc-400 font-mono">
            {contextLength > 0 ? `${contextLength.toLocaleString()} chars` : 'Empty'}
          </span>
        </label>

        <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 focus-within:ring-2 focus-within:ring-zinc-500/20 transition-all">
          <Controller
            name="context"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <textarea
                {...field}
                onChange={(event) => {
                  field.onChange(event);
                  setContextLength(event.target.value.length);
                }}
                placeholder="Paste context or load sample..."
                spellCheck={false}
                className="w-full h-full block py-3 px-4 bg-transparent border-none resize-none focus:ring-0 focus:outline-none font-mono text-[13px] leading-relaxed scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800"
              />
            )}
          />
        </div>
      </div>

      {/* Control Row */}
      <div className="shrink-0 flex items-center gap-3 mb-4">
        {/* Sample Button */}
        <button
          type="button"
          onClick={loadRandomSample}
          disabled={sampleMutation.isPending}
          title="Load a random sample from LongBench-v2 dataset"
          className={cn(
            'flex-1 flex items-center gap-2 px-3 py-2 rounded-lg',
            'bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800',
            'hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors',
            'disabled:opacity-50'
          )}
        >
          <Database className="w-4 h-4 text-zinc-500 shrink-0" />
          <div className="flex flex-col items-start min-w-0">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Sample</span>
            <span className="text-[10px] text-zinc-400 truncate">LongBench-v2</span>
          </div>
          <Shuffle
            className={cn(
              'w-3.5 h-3.5 text-zinc-400 ml-auto shrink-0',
              sampleMutation.isPending && 'animate-spin'
            )}
          />
        </button>

        {/* Sub-LLM Toggle */}
        <Controller
          name="enableSubLlm"
          control={control}
          render={({ field }) => (
            <button
              type="button"
              onClick={() => field.onChange(!field.value)}
              title={
                field.value
                  ? 'Sub-LLM calls enabled: Model can spawn recursive calls for complex reasoning'
                  : 'Sub-LLM calls disabled: Model uses only direct execution'
              }
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
                field.value
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                  : 'bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-500'
              )}
            >
              <Zap className="w-4 h-4 shrink-0" />
              <span className="text-xs font-medium">Sub-LLM</span>
              <div
                className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  field.value ? 'bg-purple-500' : 'bg-zinc-400'
                )}
              />
            </button>
          )}
        />
      </div>

      {/* Submit Button */}
      <div className="shrink-0">
        <button
          type="submit"
          disabled={isLoading || !isValid}
          className={cn(
            'w-full h-11 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg',
            isLoading || !isValid
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
              : 'bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/25 transform active:scale-[0.98]'
          )}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>RUN EXECUTION</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
