"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

const features = [
  {
    title: "Business Idea Generation",
    description:
      "Scrape relevant subreddits for posts expressing problems, needs, or 'wish I had X' statements. Use NLP to filter and categorize potential business opportunities.",
    icon: "💡",
  },
  {
    title: "Keyword Tracking & Notifications",
    description:
      "Monitor selected subreddits for specific keywords or phrases at set intervals. Receive instant notifications via email, Slack, or your dashboard.",
    icon: "🔍",
  },
  {
    title: "Subreddit Identification",
    description:
      "Provide keywords or topics, and our tool suggests the most relevant subreddits for your research, saving you hours of manual searching.",
    icon: "🎯",
  },
  {
    title: "Sentiment Analysis",
    description:
      "Understand how Reddit users feel about your brand, products, or industry with our advanced sentiment analysis tools.",
    icon: "📊",
  },
  {
    title: "Competitor Monitoring",
    description:
      "Track mentions of your competitors and analyze user sentiment to identify opportunities and threats in your market.",
    icon: "👀",
  },
  {
    title: "Trend Detection",
    description:
      "Identify emerging trends in your industry before they hit the mainstream, giving you a competitive edge.",
    icon: "📈",
  },
]

export default function Features() {
  return (
    <section id="features" className="container px-4 md:px-6 py-12 md:py-24 lg:py-32">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="flex flex-col items-center gap-6"
      >
        <motion.div variants={fadeIn} className="text-center space-y-4 max-w-[800px]">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Powerful Features to Supercharge Your Business
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground">
            Extract valuable insights from Reddit&apos;s vast community to inform your business decisions.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 pt-8 w-full"
        >
          {features.map((feature, i) => (
            <motion.div key={i} variants={fadeIn}>
              <Card className="h-full transition-all hover:shadow-md">
                <CardHeader>
                  <div className="text-4xl mb-2">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}

