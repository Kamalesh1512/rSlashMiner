"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "What is Skroub?",
    answer:
      "Skroub is an AI-powered platform that extracts relevant data from the internet based on your specific needs. Currently, it focuses on scraping and analyzing Reddit data to provide valuable insights for businesses and individuals.",
  },
  {
    question: "How does Skroub work?",
    answer:
      "Skroub uses AI agents to monitor Reddit for specific keywords, topics, or trends you're interested in. These agents analyze the content for relevance to your business and deliver the most valuable insights directly to your dashboard.",
  },
  {
    question: "Is Skroub compliant with Reddit's terms of service?",
    answer:
      "Yes, Skroub operates within Reddit's API guidelines and terms of service. We respect rate limits and follow all required policies to ensure ethical data collection.",
  },
  {
    question: "Can I customize what data Skroub collects?",
    answer:
      "You can create custom agents with specific keywords, subreddits to monitor, and relevance thresholds. This ensures you only receive information that's truly valuable to you.",
  },
  {
    question: "How accurate is Skroub's data analysis?",
    answer:
      "Skroub uses advanced AI models with an accuracy rate of over 95%. We continuously train and improve our models to better understand Reddit's unique language patterns and context.",
  },
  {
    question: "Can I export the data for use in other tools?",
    answer:
      "Yes, Pro and Business plans include data export functionality in CSV, JSON, and Excel formats, making it easy to integrate with your existing workflows and tools.",
  },
  {
    question: "Will Skroub expand to other platforms beyond Reddit?",
    answer:
      "Yes, while we currently focus on Reddit, we have plans to expand to other social media platforms, forums, and news sites in the near future to provide even more comprehensive data collection.",
  },
  {
    question: "How do I get started with Skroub?",
    answer:
      "Getting started is easy! Simply sign up for a free account, create your first agent by defining what you want to monitor, and Skroub will start collecting and analyzing data for you immediately.",
  },
]

export default function FaqSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section id="faq" className="container px-4 md:px-6 mx-auto mt-16">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Everything you need to know about Skroub
          </motion.p>
        </div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-lg font-medium py-4">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
