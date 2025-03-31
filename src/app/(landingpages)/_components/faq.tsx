"use client"

import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

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

const faqs = [
  {
    question: "Is rSlashMiner compliant with Reddit's terms of service?",
    answer:
      "Yes, rSlashMiner operates within Reddit's API guidelines and terms of service. We respect rate limits and follow all required policies to ensure ethical data collection.",
  },
  {
    question: "How accurate is the sentiment analysis?",
    answer:
      "Our sentiment analysis uses advanced NLP models with an accuracy rate of over 85%. We continuously train and improve our models to better understand Reddit's unique language patterns and context.",
  },
  {
    question: "Can I export the data for use in other tools?",
    answer:
      "Yes, Pro and Premium plans include data export functionality in CSV, JSON, and Excel formats, making it easy to integrate with your existing workflows and tools.",
  },
  {
    question: "How far back does the historical data go?",
    answer:
      "Free plans provide data from the past 30 days. Pro plans extend to 6 months, and Premium plans offer up to 2 years of historical data, subject to Reddit's API limitations.",
  },
  {
    question: "Do you offer custom solutions for enterprise needs?",
    answer:
      "Absolutely. Our enterprise solutions can be tailored to your specific business requirements. Contact our sales team to discuss your needs and how we can help.",
  },
]

export default function Faq() {
  return (
    <section id="faq" className="container px-4 md:px-6 py-12 md:py-24 lg:py-32">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="flex flex-col items-center gap-12 max-w-[800px] mx-auto"
      >
        <motion.div variants={fadeIn} className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Frequently Asked Questions</h2>
          <p className="text-lg sm:text-xl text-muted-foreground">Everything you need to know about rSlashMiner.</p>
        </motion.div>

        <motion.div variants={staggerContainer} className="w-full">
          {faqs.map((faq, i) => (
            <motion.div key={i} variants={fadeIn} className="border-b py-6">
              <details className="group">
                <summary className="flex cursor-pointer items-center justify-between">
                  <h3 className="text-lg font-medium">{faq.question}</h3>
                  <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-muted-foreground">{faq.answer}</p>
              </details>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}

