import { useState } from "react";
import { Button } from "../ui/button";
import AgentForm from "./agent-creation-form";
import { Edit } from "lucide-react";
import { Agent } from "@/lib/constants/types";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";

interface EditAgentButtonProps {
  userId: string;
  agent: Agent;
  onSuccess?: (agentId: string) => void;
  className?: string;
}

export const EditAgentButton = ({
  userId,
  agent,
  onSuccess,
  className = "",
}: EditAgentButtonProps) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={() => setShowDialog(true)}
        className={`gap-2 ${className}`}
      >
        <Edit className="h-4 w-4" />
        Edit Agent
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Create New Agent</DialogTitle>
          <AgentForm
            userId={userId}
            mode="edit"
            agent={agent}
            onClose={() => setShowDialog(false)}
            onSuccess={(agentId) => {
              setShowDialog(false);
              onSuccess?.(agentId);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
