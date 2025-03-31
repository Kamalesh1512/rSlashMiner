"use client"

import Image from "next/image"
import { motion } from "framer-motion"

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function LogoCloud() {
  return (
    <section className="border-y bg-muted/40">
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="flex flex-col items-center gap-6"
        >
          <h2 className="text-center text-sm font-medium text-muted-foreground">TRUSTED BY INNOVATIVE COMPANIES</h2>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 lg:gap-12">
            {[1, 2, 3, 4, 5].map((i) => (
              <Image
                key={i}
                src="/placeholder.svg?height=40&width=120"
                alt={`Company logo ${i}`}
                width={120}
                height={40}
                className="opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0 h-8 w-auto"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

