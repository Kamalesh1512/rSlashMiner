"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"

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

const testimonials = [
  {
    quote:
      "rSlashMiner helped us identify a major gap in our market that we were completely unaware of. We launched a new product line based on these insights and it's now our fastest-growing segment.",
    author: "Sarah Johnson",
    title: "CEO, TechStart Inc.",
  },
  {
    quote:
      "The keyword tracking feature has been invaluable for our PR team. We're able to catch and address potential issues before they escalate, and identify positive mentions to amplify.",
    author: "Michael Chen",
    title: "Marketing Director, GrowthBrand",
  },
  {
    quote:
      "As a solo entrepreneur, I don't have time to manually search through Reddit. rSlashMiner's automated subreddit identification saved me countless hours and helped me find my target audience.",
    author: "Alex Rivera",
    title: "Founder, NicheProducts",
  },
]

export default function Testimonials() {
  return (
    <section className="bg-muted/40 border-y">
      <div className="container px-4 md:px-6 py-12 md:py-24 lg:py-32">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="flex flex-col items-center gap-12"
        >
          <motion.div variants={fadeIn} className="text-center space-y-4 max-w-[800px]">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">What Our Customers Say</h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Join hundreds of businesses already leveraging Reddit insights with our platform.
            </p>
          </motion.div>

          <motion.div variants={staggerContainer} className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 w-full">
            {testimonials.map((testimonial, i) => (
              <motion.div key={i} variants={fadeIn}>
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="text-3xl mb-4">"</div>
                    <p className="mb-6 italic">{testimonial.quote}</p>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-muted flex-shrink-0"></div>
                      <div>
                        <p className="font-medium">{testimonial.author}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

