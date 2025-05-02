"use client";

import { useState, useRef } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
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
    <section id="pricing" className="container px-4 md:px-6 mx-auto mt-16">
      <div className="text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
        >
          Plans & Launch Pricing
          <Badge className="ml-3 bg-orange-100 text-red-800 hover:bg-red-100">
            prices rise after first 25 paid users
          </Badge>
        </motion.h2>
      </div>
      <SubscriptionPlansDisplay />
    </section>
  );
}
