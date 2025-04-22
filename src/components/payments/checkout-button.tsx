"use client"

import { useState } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"


interface CheckoutButtonProps extends ButtonProps {
  planId: string
  onSuccess?: () => void
  onCheckoutError?: (error: Error) => void
}

export function CheckoutButton({ planId, onSuccess, onCheckoutError, children, ...props }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  


  const handleCheckout = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create checkout session")
      }

      const { checkoutUrl } = await response.json()

      // Redirect to checkout
      window.location.href = checkoutUrl

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error creating checkout session:", error)

      toast.error("Error",{
        description: error instanceof Error ? error.message : "Failed to create checkout session",
      })

      if (onCheckoutError && error instanceof Error) {
        onCheckoutError(error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleCheckout} disabled={isLoading} {...props}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </Button>
  )
}
