/**
 * Type declaration for @tanstack/react-db.
 * Minimal stub for the collections hook used by issue link and task chip components.
 */

declare module "@tanstack/react-db" {
  export interface CollectionsContextValue {
    tasks?: {
      useQuery: (query: { queryKey: string[]; queryFn: () => Promise<unknown> }) => { data: unknown };
    };
    taskStatuses?: {
      useQuery: (query: { queryKey: string[]; queryFn: () => Promise<unknown> }) => { data: unknown };
    };
    [key: string]: unknown;
  }

  export function useCollections(): CollectionsContextValue;

  export function useLiveQuery<T>(options: {
    queryKey: string[];
    queryFn: () => Promise<T>;
  }): { data: T | undefined; isLoading: boolean; error: Error | null };
}
