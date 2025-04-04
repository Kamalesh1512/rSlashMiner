"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

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

export default function Hero() {
  return (
    <section className="container px-4 md:px-6 py-12 md:py-24 lg:py-32">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center"
      >
        <motion.div variants={fadeIn} className="flex flex-col gap-4">
          <span className="inline-block rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
            Unlock Reddit&apos;s Business Potential
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Turn Reddit Insights Into Business Opportunities
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground">
            Discover untapped business ideas, track market trends, and identify your target audience by harnessing the
            power of Reddit data.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/signup">
                Start For Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="#demo">Watch Demo</Link>
            </Button>
          </div>
        </motion.div>
        {/* <motion.div variants={fadeIn} className="relative lg:ml-auto mt-8 lg:mt-0">
          <div className="relative mx-auto w-full max-w-fit">
            <Image
              src="/placeholder.svg?height=600&width=500"
              alt="rSlashMiner Dashboard"
              width={500}
              height={600}
              className="rounded-lg border shadow-xl w-full h-auto"
            />
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-orange-500/20 blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-orange-500/20 blur-xl"></div>
          </div>
        </motion.div> */}
      </motion.div>
    </section>
  )
}

