import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

async function fetchSuggestions(query: string): Promise<string[]> {
  const res = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return res.json();
}

export function useSuggestions(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching } = useQuery({
    queryKey: ["suggestions", debouncedQuery],
    queryFn: () => fetchSuggestions(debouncedQuery),
    enabled: debouncedQuery.length >= 3,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  return {
    suggestions: data ?? [],
    isLoading: isFetching,
  };
}
