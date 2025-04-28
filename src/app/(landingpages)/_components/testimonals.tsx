"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    quote:
      "Day 2: Skroub pinged a thread asking for exactly what we sell. Closed the deal before lunch.",
    author: "Syed Ali Hasan",
    title: "Cronos PMC",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    quote:
      "We run an agency. One Reddit lead via Skroub paid for its yearly expense in one hit.",

    author: "Ritesh Hegde",
    title: "Ritz7 Automations",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    quote:
      "I'm not techy; setup took 5 minutes. My VA just replies and books demos.",
    author: "Prashant Sharma",
    title: "Build School",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    quote:
      "We ditched cold email and filled our pipeline entirely from Skroub alerts.",
    author: "Ankur Dhanuka",
    title: "C2X",
    avatar: "/placeholder.svg?height=40&width=40",
  },

  {
    quote:
      "Cold email used to be like shooting in the void. First week using Skroub: 3 inbound DMs from Reddit without even trying. Love it.",
    author: "Ayush Garg",
    title: "Signwith",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    quote:
      "Skroub is great. Now we track our brand and competitors—huge intel!",
    author: "Sathyanand",
    title: "Logbase",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    quote:
      "Used it to spot new, viable game ideas. Free tier wasn't enough—upgraded fast!",
    author: "Arvindh",
    title: "Put The Player First",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    quote:
      "Skroub finds Reddit posts where founders need data help—those leads close the fastest.",
    author: "Vatsal Sanghvi",
    title: "1811 Labs",
    avatar: "/placeholder.svg?height=40&width=40",
  },
];

export default function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

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
                  <div className="mb-4 text-2xl">
                    <svg
                      className="h-6 w-6 text-orange-500 mb-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>
                  <p className="mb-6 italic text-muted-foreground">
                    {testimonial.quote}
                  </p>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage
                        src={testimonial.avatar || "/placeholder.svg"}
                        alt={testimonial.author}
                      />
                      <AvatarFallback>{testimonial.author[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.title}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* <motion.div
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
        </motion.div> */}
      </div>
    </section>
  );
}
