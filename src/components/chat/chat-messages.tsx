"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hash, Slash } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Message } from "@/lib/constants/types";
import { useSession } from "next-auth/react";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  const session = useSession();
  const user = session.data?.user;
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-lg p-4",
        isUser ? "bg-muted/50" : "bg-background"
      )}
    >
      <Avatar
        className={cn("h-8 w-8", isUser ? "bg-primary" : "bg-orange-500")}
      >
        {isUser ? (
          <>
              {user?.image ? (
                <AvatarImage src={user.image} alt={user?.name || "User"} />
              ) : (
                <AvatarFallback>
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              )}

          </>
        ) : (
          <>
            <AvatarFallback className="bg-orange-500 text-black">
              <Slash className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div
        className={`flex-1 space-y-2 items-start gap-3 max-w-full ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        } rounded-md p-3`}
      >
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold">
            {isUser ? "You" : "rSlashMiner AI"}
          </h4>
        </div>

        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
