"use client"

/**
 * Custom hook to trigger feedback requests at appropriate moments
 */
export function useFeedback() {
  // Function to trigger feedback for agent creation
  const triggerAgentCreatedFeedback = (agentId: string) => {
    // Check if this is the user's first agent
    const isFirstAgent = localStorage.getItem("has_created_agent") !== "true"

    if (isFirstAgent) {
      // Mark that the user has created an agent
      localStorage.setItem("has_created_agent", "true")

      // Dispatch event to trigger feedback
      window.dispatchEvent(
        new CustomEvent("feedbackTrigger", {
          detail: {
            type: "agent_created",
            agentId,
          },
        }),
      )
    }
  }

  // Function to trigger feedback for agent runs
  const triggerAgentRunFeedback = (agentId: string, success: boolean) => {
    window.dispatchEvent(
      new CustomEvent("feedbackTrigger", {
        detail: {
          type: "agent_run",
          agentId,
          success,
        },
      }),
    )
  }

  // Function to trigger feedback for feature usage
  const triggerFeatureUsedFeedback = (featureId: string, featureName: string) => {
    window.dispatchEvent(
      new CustomEvent("feedbackTrigger", {
        detail: {
          type: "feature_used",
          featureId,
          featureName,
        },
      }),
    )
  }

  // Function to trigger general feedback
  const triggerGeneralFeedback = () => {
    window.dispatchEvent(
      new CustomEvent("feedbackTrigger", {
        detail: {
          type: "general",
        },
      }),
    )
  }

  return {
    triggerAgentCreatedFeedback,
    triggerAgentRunFeedback,
    triggerFeatureUsedFeedback,
    triggerGeneralFeedback,
  }
}
