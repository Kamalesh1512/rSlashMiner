"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const monthlyPlans = [
  {
    name: "Free",
    description: "Perfect for individuals just getting started.",
    price: "$0",
    features: [
      "5 keyword alerts",
      "3 subreddit monitors",
      "Daily data updates",
      "Basic sentiment analysis",
      "Email notifications",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    description: "Ideal for small businesses and startups.",
    price: "$29",
    features: [
      "25 keyword alerts",
      "15 subreddit monitors",
      "Hourly data updates",
      "Advanced sentiment analysis",
      "Slack & email notifications",
      "Competitor tracking",
      "Trend detection",
      "Data export",
    ],
    cta: "Start 14-Day Trial",
    popular: true,
  },
  {
    name: "Premium",
    description: "For businesses that need comprehensive insights.",
    price: "$99",
    features: [
      "Unlimited keyword alerts",
      "Unlimited subreddit monitors",
      "Real-time data updates",
      "Enterprise-grade sentiment analysis",
      "Custom integrations",
      "API access",
      "Dedicated support",
      "Advanced analytics dashboard",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

const annualPlans = [
  {
    name: "Free",
    description: "Perfect for individuals just getting started.",
    price: "$0",
    features: [
      "5 keyword alerts",
      "3 subreddit monitors",
      "Daily data updates",
      "Basic sentiment analysis",
      "Email notifications",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    description: "Ideal for small businesses and startups.",
    price: "$23",
    features: [
      "25 keyword alerts",
      "15 subreddit monitors",
      "Hourly data updates",
      "Advanced sentiment analysis",
      "Slack & email notifications",
      "Competitor tracking",
      "Trend detection",
      "Data export",
    ],
    cta: "Start 14-Day Trial",
    popular: true,
  },
  {
    name: "Premium",
    description: "For businesses that need comprehensive insights.",
    price: "$79",
    features: [
      "Unlimited keyword alerts",
      "Unlimited subreddit monitors",
      "Real-time data updates",
      "Enterprise-grade sentiment analysis",
      "Custom integrations",
      "API access",
      "Dedicated support",
      "Advanced analytics dashboard",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="container px-4 md:px-6 py-12 md:py-24 lg:py-32">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="flex flex-col items-center gap-8"
      >
        <motion.div variants={fadeIn} className="text-center space-y-4 max-w-[800px]">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Simple, Transparent Pricing</h2>
          <p className="text-lg sm:text-xl text-muted-foreground">
            Choose the plan that fits your needs. Start free and scale as you grow.
          </p>
        </motion.div>

        <motion.div variants={fadeIn} className="w-full max-w-[1000px]">
          <Tabs defaultValue="monthly" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="annual">Annual (Save 20%)</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="monthly" className="w-full">
              <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {monthlyPlans.map((plan, i) => (
                  <Card key={i} className={`flex flex-col ${plan.popular ? "border-primary shadow-lg relative" : ""}`}>
                    {plan.popular && (
                      <div className="absolute -top-4 left-0 right-0 mx-auto w-fit px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        Most Popular
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        {plan.price !== "$0" && <span className="text-muted-foreground">/month</span>}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
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
                      <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                        <Link href="#signup">{plan.cta}</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="annual" className="w-full">
              <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {annualPlans.map((plan, i) => (
                  <Card key={i} className={`flex flex-col ${plan.popular ? "border-primary shadow-lg relative" : ""}`}>
                    {plan.popular && (
                      <div className="absolute -top-4 left-0 right-0 mx-auto w-fit px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        Most Popular
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        {plan.price !== "$0" && <span className="text-muted-foreground">/month</span>}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
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
                      <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                        <Link href="#signup">{plan.cta}</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </section>
  )
}

