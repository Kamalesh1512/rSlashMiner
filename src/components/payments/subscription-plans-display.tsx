"use client";
import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getMonthlyPlans,
  getYearlyPlans,
} from "@/lib/payments/subscription-plans";
import { SubscriptionCard } from "./subscription-card";
import { useSession } from "next-auth/react";

const SubscriptionPlansDisplay = () => {
  // Get plans
  const monthlyPlans = getMonthlyPlans();
  const yearlyPlans = getYearlyPlans();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [offerAvailable, setOfferAvailable] = useState(false);
  const { data: session, status } = useSession();

  const fetchPaidUsers = async () => {
    try {
      const response = await fetch("/api/user");
      const data = await response.json();
      const status = data.users.length < 25;
      setOfferAvailable(status);

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch agents");
      }
    } catch (error) {
      console.error("Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchPaidUsers();
  }, []);

  return (
    <div className="container px-4 md:px-6 mx-auto mt-16">
      <Tabs
        defaultValue="monthly"
        onValueChange={(value) =>
          setBillingCycle(value as "monthly" | "annual")
        }
      >
        <div className="flex justify-center mb-8">
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annual">Annual (Save 5 months)</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="monthly">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {monthlyPlans.map((plan) => (
              <SubscriptionCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={
                  session?.user?.subscriptionTier ===
                  (plan.id === "starter_monthly"
                    ? "starter"
                    : plan.id === "growth_monthly"
                    ? "growth"
                    : plan.id === "enterprise_monthly"
                    ? "enterprise"
                    : "free")
                }
                showYearlySavings={true}
                signedIn={status === "unauthenticated" ? false : true}
                offerAvailable={offerAvailable}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="annual">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {yearlyPlans.map((plan) => (
              <SubscriptionCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={
                  session?.user?.subscriptionTier ===
                  (plan.id === "pro_yearly"
                    ? "pro"
                    : plan.id === "business_yearly"
                    ? "premium"
                    : "free")
                }
                signedIn={status === "unauthenticated" ? false : true}
                offerAvailable={offerAvailable}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionPlansDisplay;
