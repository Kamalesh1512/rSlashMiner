"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DemoSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section id="demo" className="container px-4 md:px-6 mx-auto mt-16">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
          >
            See Skroub in Action
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Watch how our AI agents extract valuable data from Reddit in real-time
          </motion.p>
        </div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7 }}
          className="relative max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl"
        >
          <div className="aspect-video bg-muted relative">
            {/* This would be replaced with an actual video player */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button size="lg" className="rounded-full w-16 h-16 flex items-center justify-center">
                <Play className="h-8 w-8" />
              </Button>
            </div>

            {/* Placeholder for video thumbnail */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-black/5 pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <span className="text-lg font-medium">Demo Video Placeholder</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Our demo showcases how Skroub can help you discover relevant information, track trends, and gain insights
            from Reddit data.
          </p>
          <Button size="lg" className="px-8">
            Try It Yourself
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
