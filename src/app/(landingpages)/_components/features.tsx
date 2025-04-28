"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Bot,
  Search,
  Bell,
  BarChart3,
  Clock,
  Zap,
  Shield,
  Layers,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Bot,
    title: "AI-Powered Agents",
    description:
      "Custom AI agents that continuously scan Reddit for relevant information based on your specific criteria.",
  },
  {
    icon: Search,
    title: "Intelligent Filtering",
    description:
      "Advanced algorithms that filter out noise and deliver only the most relevant content to your dashboard.",
  },
  {
    icon: Bell,
    title: "Real-time Notifications",
    description:
      "Get instant alerts when important information matching your criteria is discovered.",
  },
  {
    icon: BarChart3,
    title: "Comprehensive Analytics",
    description:
      "Detailed insights and trends analysis from the data collected across multiple sources.",
  },
  {
    icon: Clock,
    title: "Scheduled Monitoring",
    description:
      "Set up custom schedules for your agents to run at specific times and days that work for you.",
  },
  {
    icon: Zap,
    title: "Fast Processing",
    description:
      "Our optimized infrastructure ensures quick data extraction and analysis, saving you valuable time.",
  },
  {
    icon: Shield,
    title: "Privacy Focused",
    description:
      "Your data and search criteria are kept secure and private with enterprise-grade security.",
  },
  {
    icon: Layers,
    title: "Multi-source Integration",
    description:
      "Starting with Reddit, with plans to expand to other platforms for comprehensive data collection.",
  },
];

export default function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

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
    <div className="container px-4 md:px-6 mx-auto mt-16">
      <div className="text-center mb-12 flex flex-col items-center justify-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
        >
          Powerful Features
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          Everything you need to extract valuable insights from the internet
        </motion.p>
      </div>

      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* {features.map((feature, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="h-full border-none shadow-md hover:shadow-lg transition-shadow bg-muted/15">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))} */}
            <div className="bg-transparent p-8 rounded-xl">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-2">⚡</span>
                <h3 className="text-xl font-bold">Lightning-Fast</h3>
              </div>
              <p className="text-muted-foreground">
                Alerts within minutes—be first in the thread
              </p>
            </div>
            <div className="bg-transparent p-8 rounded-xl">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-2">🎯</span>
                <h3 className="text-xl font-bold">Hyper-Relevant</h3>
              </div>
              <p className="text-muted-foreground">
                Filters noise; shows only posts with buying intent
              </p>
            </div>
            <div className="bg-transparent p-8 rounded-xl">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-2">💤</span>
                <h3 className="text-xl font-bold">Hands-Free</h3>
              </div>
              <p className="text-muted-foreground">
                Set it once; agents work while you sleep
              </p>
            </div>
            <div className="bg-transparent p-8 rounded-xl">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-2">💸</span>
                <h3 className="text-xl font-bold">Budget-Friendly</h3>
              </div>
              <p className="text-muted-foreground">
                One sale can cover months of Skroub—no ad spend
              </p>
            </div>
          
      </motion.div>
    </div>
  );
}
