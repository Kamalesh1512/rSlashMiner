"use client"

import Image from "next/image"
import { motion } from "framer-motion"

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

const steps = [
  {
    step: "1",
    title: "Set Up Your Tracking",
    description:
      "Define your keywords, topics, or business interests. Our AI will suggest relevant subreddits to monitor.",
  },
  {
    step: "2",
    title: "Collect & Analyze Data",
    description:
      "Our system continuously scrapes Reddit for relevant content, analyzing sentiment and identifying opportunities.",
  },
  {
    step: "3",
    title: "Act On Insights",
    description:
      "Receive notifications and detailed reports to inform your business decisions and capitalize on opportunities.",
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-muted/40 border-y">
      <div className="container px-4 md:px-6 py-12 md:py-24 lg:py-32">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="flex flex-col items-center gap-12"
        >
          <motion.div variants={fadeIn} className="text-center space-y-4 max-w-[800px]">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">How rSlashMiner Works</h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Our platform makes it easy to extract valuable insights from Reddit in just a few simple steps.
            </p>
          </motion.div>

          <motion.div variants={staggerContainer} className="grid gap-8 md:grid-cols-3 w-full">
            {steps.map((item, i) => (
              <motion.div key={i} variants={fadeIn} className="relative">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%-16px)] w-[calc(100%-32px)] h-[2px] bg-border">
                    <div className="absolute -right-2 -top-1 h-4 w-4 rounded-full bg-border"></div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={fadeIn} className="w-full max-w-[900px] mt-8">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border shadow-lg">
              <Image
                src="/placeholder.svg?height=500&width=900"
                alt="rSlashMiner Workflow"
                fill
                className="object-cover"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

