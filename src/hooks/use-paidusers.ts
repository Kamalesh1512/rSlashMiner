import { useState, useEffect } from "react";

export function usePaidUsers() {
  const [userCount, setUserCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaidUsers = async () => {
      try {
        const res = await fetch("/api/user");
        const data = await res.json();

        if (!res.ok || !data) {
          throw new Error(data.message || "Failed to fetch users");
        }

        setUserCount(data.users.length);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchPaidUsers();
  }, []);

  return { userCount, loading, error };
}
