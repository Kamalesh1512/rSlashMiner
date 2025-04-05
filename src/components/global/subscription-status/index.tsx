"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubscriptionstatusProps } from "@/lib/types";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import React from "react";

const SubscriptionStatus = ({ creationLimit }: SubscriptionstatusProps) => {
  return (
    <div>
      {/* Subscription status card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>
              Your current plan and usage limits
            </CardDescription>
          </div>
          {creationLimit.tier === "free" ? (
            <Button asChild>
              <Link href="/settings/subscription">Upgrade</Link>
            </Button>
          ) : (
            <></>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span>Current Plan:</span>
              </div>
              <div className="font-medium">
                {creationLimit.tier !== "free" ? (
                  <Badge className="bg-orange-500 text-black">
                    {" "}
                    {creationLimit.tier.charAt(0).toUpperCase() +
                      creationLimit.tier.slice(1)}
                  </Badge>
                ) : (
                  <>{creationLimit.tier.charAt(0).toUpperCase() +
                    creationLimit.tier.slice(1)}</>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span>Agent Creation:</span>
              </div>
              <div className="font-medium">3 of 1 used</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span>Monitoring Requests:</span>
              </div>
              <div className="font-medium">78 of 100 used</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span>Resets</span>
              </div>
              <div className="font-medium">
                {creationLimit.period.charAt(0).toUpperCase() +
                  creationLimit.period.slice(1)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionStatus;
