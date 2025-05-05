"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import type { SubscriptionPlan } from "@/lib/payments/subscription-plans";
import { CheckoutButton } from "./checkout-button";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  showYearlySavings?: boolean;
  signedIn: boolean;
  offerAvailable:boolean
}

export function SubscriptionCard({
  plan,
  isCurrentPlan = false,
  showYearlySavings = false,
  signedIn,
  offerAvailable
}: SubscriptionCardProps) {
  const router = useRouter()

  const yearlyEquivalent =
    plan.interval === "month" && plan.price > 0 ? plan.price * 12 : null;

  return (
    <Card
      className={`flex flex-col h-full ${
        plan.popular ? "border-primary shadow-lg relative" : ""
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-0 right-0 mx-auto w-fit px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
          Most Popular
        </div>
      )}
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        <div className="mt-4">
          {offerAvailable ? (
            plan.price == 0 ? (
              <span className="text-4xl font-bold">{plan.price}</span>
            ) : (
              <span className="text-4xl font-bold relative inline-block">
                
                <span className="mr-2 relative inline-block text-gray-500">
                  ${plan.msrpPrice}
                  <span className="absolute left-0 top-1/2 w-full h-0.5 bg-orange-400 transform -rotate-12 origin-center"></span>
                </span>
                ${plan.price}
              </span>
            )
          ) : (
            <>
              <span className="text-4xl font-bold">${plan.msrpPrice}</span>
            </>
          )}
          {plan.price > 0 && (
            <span className="text-muted-foreground">/{plan.interval}</span>
          )}

          {showYearlySavings && plan.id !== "free" && (
            <div className="mt-1 text-xs text-orange-400 font-medium">
              Save 5 months with annual billing
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-2">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {signedIn ? (
          <>
            {isCurrentPlan ? (
              <div className="w-full px-4 py-2 text-center bg-primary/10 text-primary font-medium rounded-md">
                Current Plan
              </div>
            ) : plan.price === 0 ? (
              <CheckoutButton
                planId={plan.id}
                className="w-full"
                variant="outline"
              >
                Get Started
              </CheckoutButton>
            ) : (
              <CheckoutButton
                planId={plan.id}
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
              >
                Subscribe
              </CheckoutButton>
            )}
          </>
        ) : (
          <>
            {isCurrentPlan ? (
              <div className="w-full px-4 py-2 text-center bg-primary/10 text-primary font-medium rounded-md">
                Current Plan
              </div>
            ) : plan.price === 0 ? (
              <Button
                className="w-full"
                variant="outline"
                onClick={()=>router.push('/signup')}
                disabled
              >
                Get Started
              </Button>
            ) : (
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                onClick={()=>router.push("/signup")}
                disabled
              >
                Subscribe
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
