"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function Cta() {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="container px-4 md:px-6 py-12 md:py-24 lg:py-32">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="flex flex-col items-center text-center gap-8 max-w-[800px] mx-auto"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Ready to Unlock Reddit&apos;s Business Potential?
          </h2>
          <p className="text-lg sm:text-xl text-primary-foreground/80">
            Join thousands of businesses already leveraging Reddit insights to drive growth and innovation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto">
              <Link href="#signup">Start Your Free Trial</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10 w-full sm:w-auto"
              asChild
            >
              <Link href="#demo">Schedule a Demo</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

