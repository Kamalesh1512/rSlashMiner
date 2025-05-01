import React, { useState } from "react";
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
  const { data: session, status } = useSession();
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
            <TabsTrigger value="annual">Annual (Save 15%)</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="monthly">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionPlansDisplay
    ;
