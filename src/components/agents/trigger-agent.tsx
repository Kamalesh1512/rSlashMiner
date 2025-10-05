// Example React component
"use client";

import { useState } from "react";
import { Button } from "../ui/button";

export default function TriggerAgentButton({ agentId }: { agentId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const triggerAgent = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/agents/${agentId}/trigger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (res.ok) {
        // setMessage(`Success! Job ID: ${data.jobId}`);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      console.error(err);
      setMessage("Failed to trigger agent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={triggerAgent}
        disabled={loading}
        variant={'premium'}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? "Triggering..." : "Trigger Agent"}
      </Button>
      {message && <p className="mt-2">{message}</p>}
    </div>
  );
}
