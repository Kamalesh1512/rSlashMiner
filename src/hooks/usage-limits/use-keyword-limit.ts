import { useEffect, useState, useCallback } from "react";

export function useKeywordLimit() {
  const [maxKeywords, setMaxKeywords] = useState<number>(0);
  const [usedKeywords, setUsedKeywords] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchLimit = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/usage-limits/keywords");
      const data = await res.json();
      setMaxKeywords(data.max || 0);
      setUsedKeywords(data.used || 0);
    } catch (err) {
      console.error("Failed to fetch keyword limit", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLimit();
  }, [fetchLimit]);

  const remaining = maxKeywords - usedKeywords;
  const canAddMore = remaining > 0;

  const increment = () => setUsedKeywords((prev) => Math.min(prev + 1, maxKeywords));
  const decrement = () => setUsedKeywords((prev) => Math.max(prev - 1, 0));

  return {
    maxKeywords,
    usedKeywords,
    remaining,
    canAddMore,
    loading,
    refresh: fetchLimit,
    increment,
    decrement,
  };
}
