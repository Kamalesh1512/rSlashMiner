"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, PanInfo, useAnimation, useInView } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { testimonials } from "@/lib/constants/types";



export default function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [itemsToShow, setItemsToShow] = useState(3);
  const [cardWidth, setCardWidth] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  // Calculate how many testimonials to show based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsToShow(1);
      } else if (window.innerWidth < 1024) {
        setItemsToShow(2);
      } else {
        setItemsToShow(3);
      }

      // Calculate card width based on container width and items to show
      if (carouselRef.current) {
        const containerWidth = carouselRef.current.offsetWidth;
        setCardWidth(containerWidth / itemsToShow);
      }
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, [itemsToShow]);

  // Autoplay functionality
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      goToNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused]);

  const maxIndex = testimonials.length - itemsToShow;

  const goToPrevious = () => {
    const newIndex = Math.max(currentIndex - 1, 0);
    setCurrentIndex(newIndex);
    updateCarouselPosition(newIndex);
  };

  const goToNext = () => {
    const newIndex = Math.min(currentIndex + 1, maxIndex);
    setCurrentIndex(newIndex);
    updateCarouselPosition(newIndex);
  };

  const goToSlide = (index: number) => {
    const newIndex = Math.min(Math.max(index, 0), maxIndex);
    setCurrentIndex(newIndex);
    updateCarouselPosition(newIndex);
  };

  const updateCarouselPosition = (index: number) => {
    if (cardWidth === 0) return;
    controls.start({
      x: -index * cardWidth,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    });
  };

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = cardWidth / 2;
    const offset = info.offset.x;

    if (offset > threshold && currentIndex > 0) {
      goToPrevious();
    } else if (offset < -threshold && currentIndex < maxIndex) {
      goToNext();
    } else {
      // Snap back to current position
      updateCarouselPosition(currentIndex);
    }
  };

  // Render star ratings
  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="relative w-full">
      <div className="mx-auto mt-16 flex flex-col items-center justify-between mb-12">
        <h1 className="text-3xl md:text-4xl font-bold inline-flex items-center">
          What Users Are Saying
        </h1>
        <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
             Discover how businesses of all sizes are using Skroub to gain leads.
          </motion.p>
      </div>
      <div
        className="overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        ref={carouselRef}
      >
        <motion.div
          className="flex"
          drag="x"
          dragConstraints={{ left: -cardWidth * maxIndex, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          animate={controls}
          initial={false}
        >
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              className={cn(
                "flex-shrink-0 px-3",
                itemsToShow === 1
                  ? "w-full"
                  : itemsToShow === 2
                  ? "w-1/2"
                  : "w-1/3"
              )}
              style={{ width: cardWidth ? cardWidth : "auto" }}
            >
              <Card className="h-full">
                <CardContent className="pt-6">
                  <div className="text-3xl mb-4">
                    <svg
                      className="h-6 w-6 text-orange-500 mb-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>
                  <p className="mb-6 italic">{testimonial.quote}</p>
                  <div className="flex items-center gap-4">
                    {/* <Image
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.author}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    /> */}
                    <div>
                      <p className="font-medium">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.title}
                      </p>
                      {renderRating(testimonial.rating)}
                      {/* <p className="text-xs text-muted-foreground mt-1">{testimonial.date}</p> */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Touch indicator - only shown on mobile */}
      <div className="md:hidden text-center text-sm text-muted-foreground mt-4">
        <span>← Swipe to see more →</span>
      </div>


      {/* Pagination Dots */}
      <div className="flex justify-center mt-6 gap-2">
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <button
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentIndex
                ? "bg-primary w-4"
                : "bg-gray-300 dark:bg-gray-600"
            }`}
            onClick={() => goToSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-6">
          Join hundreds of satisfied customers
        </h2>
        <div className="flex flex-wrap justify-center gap-8 items-center max-w-4xl mx-auto">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="grayscale hover:grayscale-0 transition-all duration-300"
            >
              <img
                src={`/placeholder.svg?height=60&width=${100 + i * 20}`}
                alt={`Company logo ${i + 1}`}
                className="h-12 w-auto opacity-70 hover:opacity-100 transition-opacity"
              />
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
}
