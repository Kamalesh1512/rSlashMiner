/**
 * Dodo Payments API Client
 *
 * This client handles all interactions with the Dodo Payments API.
 */

export interface DodoPaymentSessionOptions {
  amount: number;
  currency: string;
  customerId?: string;
  customerEmail: string;
  customerName?: string;
  metadata?: Record<string, any>;
  successUrl: string;
  cancelUrl: string;
  description?: string;
  paymentMethod?: string;
}

export interface DodoPaymentSession {
  id: string;
  status: "created" | "processing" | "succeeded" | "failed" | "canceled";
  checkoutUrl: string;
  amount: number;
  currency: string;
  createdAt: string;
  expiresAt: string;
}

export interface DodoCustomer 
  {
    customer_id: string,
    business_id: string,
    name: string,
    email: string,
    phone_number: number | null,
    created_at:string
  }


export interface DodoSubscription {
  id: string;
  status: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
  customerId: string;
  planId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export class DodoPaymentsClient {
  private apiKey: string;
  private apiBaseUrl: string;
  private webhookSecret: string;

  constructor(
    apiKey: string,
    webhookSecret: string,
    apiBaseUrl = "https://api.dodopayments.com"
  ) {
    this.apiKey = apiKey;
    this.apiBaseUrl = apiBaseUrl;
    this.webhookSecret = webhookSecret;
  }

  /**
   * Create a payment session
   */
  async createPaymentSession(
    options: DodoPaymentSessionOptions
  ): Promise<DodoPaymentSession> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v1/payment-sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const text = await response.text();
          console.log(text)
          if (text) {
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          }
        } catch (err) {
          // log parse error or ignore
        }
        throw new Error(`Dodo Payments API error: ${errorMessage}`);
      }
      const result = await response.json();
      return result

      return await response.json();
    } catch (error) {
      console.error("Error creating Dodo payment session:", error);
      throw error;
    }
  }

  /**
   * Retrieve a payment session
   */
  async getPaymentSession(sessionId: string): Promise<DodoPaymentSession> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/v1/payment-sessions/${sessionId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const text = await response.text();
          console.log(text)
          if (text) {
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          }
        } catch (err) {
          // log parse error or ignore
        }
        throw new Error(`Dodo Payments API error: ${errorMessage}`);
      }
      const result = await response.json();
      return result

      return await response.json();
    } catch (error) {
      console.error("Error retrieving Dodo payment session:", error);
      throw error;
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(email: string, name?: string): Promise<DodoCustomer> {
    try {

      const response = await fetch(`${this.apiBaseUrl}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ email:email, name:name }),
      });

      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const text = await response.text();
          console.log(text)
          if (text) {
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          }
        } catch (err) {
          // log parse error or ignore
        }
        throw new Error(`Dodo Payments API error: ${errorMessage}`);
      }
      const result = await response.json();
      return result
    } catch (error) {
      console.error("Error creating Dodo customer:", error);
      throw error;
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(
    customerId: string,
    planId: string
  ): Promise<DodoSubscription> {
    try {
      
      const response = await fetch(`${this.apiBaseUrl}/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ customerId, planId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Dodo Payments API error: ${errorData.message || response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating Dodo subscription:", error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd = true
  ): Promise<DodoSubscription> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/v1/subscriptions/${subscriptionId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({ cancelAtPeriodEnd }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Dodo Payments API error: ${errorData.message || response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error canceling Dodo subscription:", error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Implement webhook signature verification according to Dodo Payments documentation
    // This is a placeholder implementation
    try {
      // In a real implementation, you would:
      // 1. Extract timestamp and signatures from the signature header
      // 2. Create a signature using the webhook secret and payload
      // 3. Compare with the provided signature

      // For now, we'll just return true
      return true;
    } catch (error) {
      console.error("Error verifying webhook signature:", error);
      return false;
    }
  }
}

// Create a singleton instance of the client
export const dodoPaymentsClient = new DodoPaymentsClient(
  process.env.DODO_PAYMENTS_API_KEY!,
  process.env.DODO_PAYMENTS_WEBHOOK_SECRET!,
  process.env.DODO_PAYMENTS_BASE_URL
);
