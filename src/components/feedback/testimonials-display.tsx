"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Testimonial {
  id: string
  name: string
  role?: string
  company?: string
  avatar?: string
  rating: number
  text: string
  date: string
}

interface TestimonialsDisplayProps {
  testimonials?: Testimonial[]
  autoplay?: boolean
  interval?: number
  className?: string
}

export default function TestimonialsDisplay({
  testimonials: propTestimonials,
  autoplay = true,
  interval = 5000,
  className = "",
}: TestimonialsDisplayProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(propTestimonials || [])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // If no testimonials are provided, fetch them from the API
  useEffect(() => {
    if (propTestimonials) {
      setTestimonials(propTestimonials)
      return
    }

    const fetchTestimonials = async () => {
      try {
        const response = await fetch("/api/user/testimonials")
        if (response.ok) {
          const data = await response.json()
          setTestimonials(data)
        }
      } catch (error) {
        console.error("Failed to fetch testimonials:", error)
      }
    }

    fetchTestimonials()
  }, [propTestimonials])

  // Autoplay functionality
  useEffect(() => {
    if (!autoplay || testimonials.length <= 1 || isPaused) return

    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
    }, interval)

    return () => clearInterval(timer)
  }, [autoplay, interval, testimonials.length, isPaused, currentIndex])

  const goToPrevious = () => {
    if (testimonials.length <= 1) return
    setDirection(-1)
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
  }

  const goToNext = () => {
    if (testimonials.length <= 1) return
    setDirection(1)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -500 : 500,
      opacity: 0,
    }),
  }

  // If no testimonials, show placeholder
  if (testimonials.length === 0) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center p-8">
            <Quote className="h-12 w-12 text-primary/20 mb-4" />
            <p className="text-muted-foreground">No testimonials yet. Be the first to share your experience!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
        >
          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center md:items-start">
                  <Avatar className="h-16 w-16 mb-2">
                    <AvatarImage
                      src={testimonials[currentIndex].avatar || "/placeholder.svg"}
                      alt={testimonials[currentIndex].name}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {testimonials[currentIndex].name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < testimonials[currentIndex].rating ? "fill-primary text-primary" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="text-2xl mb-2">"</div>
                  <p className="text-base italic mb-4">{testimonials[currentIndex].text}</p>
                  <div className="flex flex-col">
                    <span className="font-semibold">{testimonials[currentIndex].name}</span>
                    {(testimonials[currentIndex].role || testimonials[currentIndex].company) && (
                      <span className="text-sm text-muted-foreground">
                        {testimonials[currentIndex].role}
                        {testimonials[currentIndex].role && testimonials[currentIndex].company && ", "}
                        {testimonials[currentIndex].company}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {testimonials.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm p-2 rounded-full z-10 hover:bg-background/90 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm p-2 rounded-full z-10 hover:bg-background/90 transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1)
                  setCurrentIndex(index)
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? "bg-primary w-4" : "bg-gray-300 dark:bg-gray-600"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
