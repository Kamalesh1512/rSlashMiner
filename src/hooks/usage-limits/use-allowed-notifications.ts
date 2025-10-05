import { allowedAlertChannels } from "@/lib/payments/check-subscriptions";
import { useEffect, useState } from "react";

type NotificationOption = {
  value: string;
  label: string;
};

export function useAllowedNotifications() {
  const [availableAlerts, setAvailableAlerts] = useState<string[]>([]);
  const [selectOptions, setSelectOptions] = useState<NotificationOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/usage-limits/alerts");
        const data = await res.json();
        const alerts = data.alerts;
        setAvailableAlerts(data.alerts);

        if (alerts.includes("email") && alerts.includes("slack")) {
          setSelectOptions([
            { value: "email", label: "Email Only" },
            { value: "slack", label: "Slack Only" },
            { value: "both", label: "Both Email and Slack" },
          ]);
        } else if (alerts.includes("email")) {
          setSelectOptions([{ value: "email", label: "Email Only" }]);
        } else if (alerts.includes("slack")) {
          setSelectOptions([{ value: "slack", label: "Slack Only" }]);
        } else {
          setSelectOptions([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  return {
    availableAlerts,
    selectOptions,
    loading,
  };
}
