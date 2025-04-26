"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface SubscriptionStatus {
  active: boolean;
  plan: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export function SubscriptionManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/subscription");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch subscription");
      }

      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch subscription"
      );

      toast.error("Error", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to fetch subscription",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCanceling(true);

    try {
      const response = await fetch("/api/payments/subscription", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cancelAtPeriodEnd: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel subscription");
      }

      await fetchSubscription();

      toast.success("Subscription canceled", {
        description: "Your subscription will end at the current billing period",
      });
    } catch (error) {
      console.error("Error canceling subscription:", error);

      toast("Error", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to cancel subscription",
      });
    } finally {
      setIsCanceling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium">Failed to load subscription</h3>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button onClick={fetchSubscription} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  const planName =
    subscription.plan === "pro"
      ? "Pro"
      : subscription.plan === "premium"
      ? "Business"
      : "Free";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
        <CardDescription>Manage your current subscription plan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-2">Current Plan: {planName}</h3>

          {subscription.active && subscription.plan !== "free" ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Your subscription is currently active.
                {subscription.cancelAtPeriodEnd
                  ? " Your subscription will end at the end of the current billing period."
                  : ""}
              </p>

              {subscription.currentPeriodEnd && (
                <div className="flex items-center justify-between border-t pt-4 mt-4">
                  <span className="text-sm font-medium">
                    Next billing date:
                  </span>
                  <span className="text-sm">
                    {new Date(
                      subscription.currentPeriodEnd
                    ).toLocaleDateString()}
                    (
                    {formatDistanceToNow(
                      new Date(subscription.currentPeriodEnd),
                      { addSuffix: true }
                    )}
                    )
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {subscription.plan === "free"
                ? "You are currently on the free plan. Upgrade to access premium features."
                : "Your subscription is not active."}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {subscription.active &&
        subscription.plan !== "free" &&
        !subscription.cancelAtPeriodEnd ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isCanceling}>
                {isCanceling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  "Cancel Subscription"
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you sure you want to cancel?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Your subscription will remain active until the end of the
                  current billing period. After that, your account will be
                  downgraded to the free plan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelSubscription}>
                  Cancel Subscription
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : subscription.cancelAtPeriodEnd ? (
          <Button variant="outline" onClick={fetchSubscription}>
            Reactivate Subscription
          </Button>
        ) : (
          <></>
        )}

        <Button variant="outline" onClick={fetchSubscription}>
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}
