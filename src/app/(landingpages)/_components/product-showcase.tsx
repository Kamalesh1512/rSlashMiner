"use client"

import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"

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

const showcaseItems = [
  {
    id: "dashboard",
    title: "Intuitive Dashboard",
    description: "Get a bird's eye view of all your monitoring activities, results, and insights in one place.",
    image: "/placeholder.svg?height=600&width=1000",
    alt: "rSlashMiner Dashboard",
  },
  {
    id: "agents",
    title: "AI Agents Management",
    description:
      "Create, configure, and manage multiple AI agents to monitor different business interests across Reddit.",
    image: "/placeholder.svg?height=600&width=1000",
    alt: "Agents Management Page",
  },
  {
    id: "monitoring",
    title: "Real-time Monitoring",
    description: "Track subreddits and keywords in real-time with our advanced monitoring system.",
    image: "/placeholder.svg?height=600&width=1000",
    alt: "Monitoring Interface",
  },
  {
    id: "notifications",
    title: "Smart Notifications",
    description:
      "Get notified about high-relevance matches through your preferred channels - email, WhatsApp, or in-app.",
    image: "/placeholder.svg?height=600&width=1000",
    alt: "Notifications Center",
  },
  {
    id: "analytics",
    title: "Advanced Analytics",
    description: "Gain deeper insights with our comprehensive analytics and reporting tools.",
    image: "/placeholder.svg?height=600&width=1000",
    alt: "Analytics Dashboard",
  },
]

export default function ProductShowcase() {
  return (
    <section className="bg-muted/40 border-y container px-4 md:px-6 py-12 md:py-24 lg:py-32">
      <div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="flex flex-col items-center gap-12"
        >
          <motion.div variants={fadeIn} className="text-center space-y-4 max-w-[800px]">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Designed for Business Growth</h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Explore our powerful platform designed to help you discover opportunities and insights from Reddit.
            </p>
          </motion.div>

          <motion.div variants={fadeIn} className="w-full">
            <Tabs defaultValue="dashboard" className="w-full">
              <div className="flex justify-center mb-8">
                <TabsList className="grid w-full max-w-[800px] grid-cols-2 md:grid-cols-5">
                  {showcaseItems.map((item) => (
                    <TabsTrigger key={item.id} value={item.id}>
                      {item.title.split(" ")[0]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {showcaseItems.map((item) => (
                <TabsContent key={item.id} value={item.id} className="w-full">
                  <div className="grid gap-6 md:grid-cols-2 items-center">
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary"></div>
                          <span>Intuitive user interface</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary"></div>
                          <span>Real-time updates</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary"></div>
                          <span>Customizable settings</span>
                        </li>
                      </ul>
                    </div>
                    <div className="rounded-lg border overflow-hidden shadow-lg">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.alt}
                        width={1000}
                        height={600}
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

