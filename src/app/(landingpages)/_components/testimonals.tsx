"use client"

import { useRef } from "react"
import Image from "next/image"
import { motion, useInView } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
  {
    quote:
      "Skroub has completely transformed how we gather market intelligence. The AI agents find relevant discussions on Reddit that we would have never discovered manually.",
    author: "Sarah Johnson",
    title: "Marketing Director, TechCorp",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    quote:
      "As a product manager, I need to stay on top of user feedback. Skroub helps me monitor Reddit for mentions of our product and competitors in real-time.",
    author: "Michael Chen",
    title: "Product Manager, SaaS Solutions",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    quote:
      "The scheduled monitoring feature saves me hours every week. I get notifications about relevant Reddit discussions without having to manually search.",
    author: "Alex Rivera",
    title: "Content Strategist, MediaGroup",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    quote:
      "We've increased our customer acquisition by 30% since implementing Skroub. It helps us identify potential customers expressing pain points our product solves.",
    author: "Jessica Wong",
    title: "Growth Lead, StartupX",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

export default function TestimonialsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <section className="container px-4 md:px-6 mx-auto mt-16">
      <div className="">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
          >
            What Our Users Say
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Join thousands of professionals already using Skroub
          </motion.p>
        </div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {testimonials.map((testimonial, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="mb-4 text-2xl">"</div>
                  <p className="mb-6 italic text-muted-foreground">{testimonial.quote}</p>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.author} />
                      <AvatarFallback>{testimonial.author[0]}</AvatarFallback>
                    </Avatar>
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-center mt-12"
        >
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-70">
            {[1, 2, 3, 4, 5].map((i) => (
              <Image
                key={i}
                src={`/placeholder.svg?height=30&width=120&text=Company${i}`}
                alt={`Company logo ${i}`}
                width={120}
                height={30}
                className="h-8 w-auto grayscale"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
