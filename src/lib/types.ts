export interface SubscriptionstatusProps {
    creationLimit: {
      canCreate: boolean;
      used: number;
      limit: number;
      tier: string;
      monitoringRequests: number;
      period: string;
    };
  }