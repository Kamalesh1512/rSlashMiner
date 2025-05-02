import { useEffect, useState } from "react";

type ScheduledRuns = {
  enabled: boolean;
  interval: string | null;
  type: string;
};

export function useScheduledRuns() {
  const [scheduledRuns, setScheduledRuns] = useState<ScheduledRuns>({
    enabled: false,
    interval: null,
    type: "none",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScheduledRuns = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/usage-limits/schedule-runs");
        const data = await res.json();

        setScheduledRuns({
          enabled: data.enabled,
          interval: data.interval,
          type: data.type,
        });
      } catch (err) {
        console.error("Failed to fetch scheduled runs info", err);
        setScheduledRuns({
          enabled: false,
          interval: null,
          type: "none",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchScheduledRuns();
  }, []);

  return {
    scheduledRuns,
    loading,
  };
}
