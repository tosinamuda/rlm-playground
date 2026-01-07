'use client';

import { useState, useCallback, useRef } from 'react';
import { TrajectoryStep } from '../types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/rlm/stream';

/**
 * Custom hook to manage the RLM execution stream via WebSocket.
 *
 * It handles the connection lifecycle, sending the initial query, and
 * accumulating the streaming steps and final answer.
 *
 * @returns Object containing:
 * - steps: Array of accumulated trajectory steps
 * - finalAnswer: The final result string (if complete)
 * - status: Current execution status ('idle', 'running', 'complete', 'error')
 * - execute: Function to trigger a new RLM execution
 */
export function useRLMStream() {
  const [steps, setSteps] = useState<TrajectoryStep[]>([]);
  const [finalAnswer, setFinalAnswer] = useState<string>();
  const [status, setStatus] = useState<'idle' | 'running' | 'complete' | 'error'>('idle');
  const wsRef = useRef<WebSocket | null>(null);

  /**
   * Initiates a new RLM execution.
   *
   * @param query - The user's query
   * @param context - The long context to process
   * @param enableSubLlm - Whether to allow recursive sub-LLM calls
   */
  const execute = useCallback(
    (query: string, context: string, enableSubLlm: boolean = true) => {
      // Clear previous state FIRST
      setSteps([]);
      setFinalAnswer(undefined);
      setStatus('running');

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        // Only send if this is still the active connection
        if (wsRef.current === ws) {
          ws.send(JSON.stringify({ query, context, enable_sub_llm: enableSubLlm }));
        }
      };

      ws.onmessage = (event) => {
        // Ignore messages from stale connections
        if (wsRef.current !== ws) return;

        try {
          const data = JSON.parse(event.data);

          if (data.type === 'step') {
            setSteps((prev) => [...prev, data.step]);
          } else if (data.type === 'final') {
            setFinalAnswer(data.answer);
            setStatus('complete');
          } else if (data.error) {
            setStatus('error');
            console.error('RLM Error:', data.error);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
          setStatus('error');
        }
      };

      ws.onerror = () => {
        if (wsRef.current === ws) {
          setStatus('error');
        }
      };

      ws.onclose = () => {
        // Only update status if this is still the active connection
        if (wsRef.current === ws) {
          setStatus((prev) => (prev === 'running' ? 'complete' : prev));
        }
      };
    },
    [] // No dependencies needed
  );

  return { steps, finalAnswer, status, execute };
}
