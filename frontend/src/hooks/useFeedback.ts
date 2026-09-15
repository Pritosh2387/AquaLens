import { useMutation } from '@tanstack/react-query';
import { feedbackApi } from '../api/feedbackApi';
import { Module15Request } from '../types/api';
import { Module15Response } from '../types/pipeline';

export function useFeedback() {
  const mutation = useMutation<Module15Response, Error, Module15Request>({
    mutationFn: (req: Module15Request) => feedbackApi.compareFeedback(req),
  });

  return {
    compare: mutation.mutate,
    compareAsync: mutation.mutateAsync,
    isComparing: mutation.isPending,
    feedbackData: mutation.data,
    feedbackError: mutation.error,
    reset: mutation.reset,
  };
}
