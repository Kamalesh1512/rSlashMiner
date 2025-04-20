"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Star, Send, ThumbsUp } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface FeedbackFormProps {
  isOpen: boolean
  onClose: () => void
  eventType: "agent_created" | "agent_run" | "feature_used" | "general"
  entityId?: string // ID of the agent or feature that triggered the feedback
}

export default function FeedbackForm({ isOpen, onClose, eventType, entityId }: FeedbackFormProps) {
  const [step, setStep] = useState<"rating" | "details" | "success">("rating")
  const [rating, setRating] = useState<number | null>(null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [feedback, setFeedback] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [allowTestimonial, setAllowTestimonial] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getEventTitle = () => {
    switch (eventType) {
      case "agent_created":
        return "How was your experience creating your first agent?"
      case "agent_run":
        return "How was your experience running this agent?"
      case "feature_used":
        return "How was your experience using this feature?"
      case "general":
      default:
        return "How has your experience with Skroub been?"
    }
  }

  const handleRatingSelect = (value: number) => {
    setRating(value)
    // Automatically move to next step after rating
    setTimeout(() => setStep("details"), 300)
  }

  const handleSubmit = async () => {
    if (!rating) return

    setIsSubmitting(true)

    try {
      // In a real implementation, you would send this data to your API
      await fetch("/api/user/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          feedback,
          email: email || undefined,
          name: name || undefined,
          allowTestimonial,
          eventType,
          entityId,
          timestamp: new Date().toISOString(),
        }),
      })

      // Show success state
      setStep("success")

      // Close after showing success for a moment
      setTimeout(() => {
        onClose()
        toast.success("Thank you for your feedback!")

        // Reset form for next time
        setRating(null)
        setFeedback("")
        setEmail("")
        setName("")
        setAllowTestimonial(false)
        setStep("rating")
      }, 2000)
    } catch (error) {
      toast.error("Failed to submit feedback. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }

  const formVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 25, stiffness: 300 } },
  }

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={overlayVariants}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div variants={formVariants} className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <Card className="border-2 shadow-lg">
            <CardHeader className="relative pb-3">
              <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
              <CardTitle>{getEventTitle()}</CardTitle>
              <CardDescription>Your feedback helps us improve Skroub for everyone</CardDescription>
            </CardHeader>

            <CardContent>
              <AnimatePresence mode="wait">
                {step === "rating" && (
                  <motion.div
                    key="rating"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={stepVariants}
                    className="space-y-4"
                  >
                    <div className="flex justify-center py-4">
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => handleRatingSelect(value)}
                            onMouseEnter={() => setHoverRating(value)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="relative transition-all duration-200"
                          >
                            <Star
                              className={`h-10 w-10 transition-all duration-200 ${
                                (hoverRating !== null ? value <= hoverRating : value <= (rating || 0))
                                  ? "fill-primary text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={value === rating ? { scale: 1.2 } : { scale: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 10 }}
                              className="absolute inset-0 pointer-events-none"
                            >
                              {value === rating && <Star className="h-10 w-10 fill-primary text-primary" />}
                            </motion.div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === "details" && (
                  <motion.div
                    key="details"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={stepVariants}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="feedback">Tell us more about your experience</Label>
                      <Textarea
                        id="feedback"
                        placeholder="What did you like? What could be improved?"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="flex items-start space-x-2">
                        <RadioGroup defaultValue="no">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="yes"
                              id="testimonial-yes"
                              checked={allowTestimonial}
                              onClick={() => setAllowTestimonial(true)}
                            />
                            <Label htmlFor="testimonial-yes">Allow us to use your feedback as a testimonial</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="no"
                              id="testimonial-no"
                              checked={!allowTestimonial}
                              onClick={() => setAllowTestimonial(false)}
                            />
                            <Label htmlFor="testimonial-no">Keep my feedback private</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {allowTestimonial && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="name">Name (optional)</Label>
                            <Input
                              id="name"
                              placeholder="How should we credit you?"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email (optional)</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="In case we need to follow up"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}

                {step === "success" && (
                  <motion.div
                    key="success"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={stepVariants}
                    className="py-8 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 10 }}
                      className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
                    >
                      <ThumbsUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </motion.div>
                    <h3 className="text-xl font-semibold">Thank You!</h3>
                    <p className="text-muted-foreground">Your feedback helps us make Skroub better for everyone.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-4">
              {step === "details" && (
                <>
                  <Button variant="outline" onClick={() => setStep("rating")}>
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, ease: "linear" }}
                          className="mr-2"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        </motion.div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
