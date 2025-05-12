"use client";
import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getMonthlyPlans,
  getYearlyPlans,
} from "@/lib/payments/subscription-plans";
import { SubscriptionCard } from "./subscription-card";
import { useSession } from "next-auth/react";
import { usePaidUsers } from "@/hooks/use-paidusers";

const SubscriptionPlansDisplay = () => {
  // Get plans
  const monthlyPlans = getMonthlyPlans();
  const yearlyPlans = getYearlyPlans();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [offerAvailable, setOfferAvailable] = useState(false);
  const { data: session, status } = useSession();

  const { loading, userCount } = usePaidUsers();

  useEffect(() => {
    if (!loading) {
      const status = userCount < 25;
      setOfferAvailable(status);
    }
  }, [loading, userCount]);

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
