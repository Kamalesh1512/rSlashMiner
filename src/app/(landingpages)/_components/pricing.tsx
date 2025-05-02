"use client";

import { useState, useRef } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SubscriptionPlansDisplay from "@/components/payments/subscription-plans-display";
import { Badge } from "@/components/ui/badge";

export default function PricingSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section id="pricing" className="mx-auto mt-16">
      <div className="flex flex-col items-center justify-between mb-12">
        <h2 className="text-3xl md:text-4xl font-bold inline-flex items-center">
          Plans & Launch Pricing
          <Badge className="ml-3 bg-orange-100 text-red-800 hover:bg-red-100">
            prices rise after first 25 paid users
          </Badge>
        </h2>
        </div>
        <SubscriptionPlansDisplay />
      
    </section>
  );
}
