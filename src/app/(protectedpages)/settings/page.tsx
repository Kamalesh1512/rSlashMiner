"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import ProfileForm from "@/components/settings/profile-form";
import ThemeSelector from "@/components/settings/theme-selector";
import SecuritySettings from "@/components/settings/security-settings";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SubscriptionstatusProps } from "@/lib/constants/types";
import SubscriptionPage from "@/components/payments/subscriptions-details";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("profile");
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionstatusProps['creationLimit']>();


  const fetchSubscriptionLimit = async () => {
    try {
      const res = await fetch("/api/subscription/check-limit");

      if (res.ok) {
        const response = await res.json();
        setSubscriptionDetails(response.data);
      } 
    } catch (error) {
      console.error("Error fetching subscription details:", error);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (status === "authenticated") {
      // fetchSubscriptionLimit()
    }
  }, [status, router]);




  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  
  }

  return (
    <div className="flex-col items-center justify-between">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.button
          variants={fadeIn}
          onClick={() => router.back()}
          className="flex items-center mb-6 text-muted-foreground hover:text-primary transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </motion.button>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className=""
        >
          <TabsList className="grid w-full grid-cols-4 space-x-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <ProfileForm user={session?.user} />
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <ThemeSelector />
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <SecuritySettings />
            </Card>
          </TabsContent>
          <TabsContent value="subscription" className="space-y-6">
              <SubscriptionPage/>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}