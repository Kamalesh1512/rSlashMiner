"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

// Array of images for the slideshow
const images = [
  {
    src: "/dashboard.png",
    alt: "Dashboard View",
  },
  {
    src: "/agent_details.png",
    alt: "Agent Configuration",
  },
  {
    src: "/subreddits-monitoring.png",
    alt: "Subreddits Monitoring",
  },
  {
    src: "/notifications.png",
    alt: "Real-time Notifications",
  },
  {
    src: "/results.png",
    alt: "Results Overview",
  },
]

export default function Slideshow() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1) // 1 for right, -1 for left

  // Auto-advance the slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(interval)
  }, [])

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: 0,
    }),
  }

  // Indicators for the current slide
  const renderIndicators = () => {
    return (
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {images.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? "bg-primary w-4" : "bg-gray-400/50"
            }`}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1)
              setCurrentIndex(index)
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
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
          className="absolute inset-0"
        >
          <Image
            src={images[currentIndex].src || "/placeholder.svg"}
            alt={images[currentIndex].alt}
            fill
            className="object-fill"
            priority
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      {/* <button
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm p-2 rounded-full z-20 hover:bg-background/90 transition-colors"
        onClick={() => {
          setDirection(-1)
          setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length)
        }}
        aria-label="Previous slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button> */}

      {/* <button
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm p-2 rounded-full z-20 hover:bg-background/90 transition-colors"
        onClick={() => {
          setDirection(1)
          setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
        }}
        aria-label="Next slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button> */}

      {/* Slide indicators */}
      {renderIndicators()}
    </div>
  )
}
