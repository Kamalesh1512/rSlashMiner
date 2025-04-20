"use client"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CtaSection() {
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center gap-8 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to Extract Valuable Data from Reddit?</h2>
          <p className="text-xl text-primary-foreground/80">
            Join thousands of professionals already using Skroub to discover insights, track trends, and make
            data-driven decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" variant="secondary" className="text-base px-8 h-12">
              Start For Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 h-12 bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10"
            >
              Schedule a Demo
            </Button>
          </div>
          <p className="text-sm text-primary-foreground/70">
            No credit card required. Free plan available with basic features.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
