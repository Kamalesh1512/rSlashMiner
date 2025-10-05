"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import AgentForm from "./agent-creation-form";
import { Plus } from "lucide-react";
import { Agent } from "@/lib/constants/types";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";

interface CreateAgentButtonProps {
  userId: string;
  onSuccess?: (agentId: string) => void;
  className?: string;
}

export const CreateAgentButton = ({
  userId,
  onSuccess,
  className = "",
}: CreateAgentButtonProps) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className={`gap-2 ${className}`}
      >
        <Plus className="h-4 w-4" />
        Create New Agent
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Create New Agent</DialogTitle>
          <AgentForm
            userId={userId}
            mode="create"
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
