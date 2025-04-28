"use client"

import { useState, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"

const plans = [
  {
    name: "Free",
    description: "For individuals just getting started",
    monthlyPrice: "$0",
    annualPrice: "$0",
    features: ["1 AI agent", "5 subreddit monitors", "Daily data updates", "Basic analytics", "Email notifications"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    description: "For professionals and small teams",
    monthlyPrice: "$14.99",
    annualPrice: "$12.74",
    features: [
      "3 AI agents",
      "15 subreddit monitors",
      "Hourly data updates",
      "Advanced analytics",
      "Email & WhatsApp notifications",
      "Scheduled monitoring",
      "Data export",
    ],
    cta: "Go Pro",
    popular: true,
  },
  {
    name: "Business",
    description: "For businesses with advanced needs",
    monthlyPrice: "$49.99",
    annualPrice: "$42.49",
    features: [
      "Unlimited AI agents",
      "Unlimited subreddit monitors",
      "Real-time data updates",
      "Enterprise analytics",
      "Priority support",
      "API access",
      "Custom integrations",
      "Team collaboration",
    ],
    cta: "Subscribe",
    popular: false,
  },
]

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
  const ref = useRef(null)
  const router = useRouter()
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <section id="pricing" className="container px-4 md:px-6 mx-auto mt-16">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
          >
            Simple, Transparent Pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Choose the plan that fits your needs
          </motion.p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2 bg-muted/15 p-1 rounded-lg">
            <Label
              htmlFor="billing-toggle"
              className={`px-3 py-1 rounded-md cursor-pointer ${billingCycle === "monthly" ? "bg-background shadow-sm" : ""}`}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={billingCycle === "annual"}
              onCheckedChange={(checked) => setBillingCycle(checked ? "annual" : "monthly")}
            />
            <Label
              htmlFor="billing-toggle"
              className={`px-3 py-1 rounded-md cursor-pointer ${billingCycle === "annual" ? "bg-background shadow-sm" : ""}`}
              onClick={() => setBillingCycle("annual")}
            >
              Annual <span className="text-xs text-primary">Save 15%</span>
            </Label>
          </div>
        </div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {plans.map((plan, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className={`h-full ${plan.popular ? "border-primary shadow-lg relative" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 mx-auto w-fit px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      {billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"} onClick={() => router.push('/login')} disabled>
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
