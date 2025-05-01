"use client";

import { useEffect } from "react";
import { useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import HeroSection from "./_components/hero";
import Header from "./_components/header";
import FeaturesSection from "./_components/features";
import DemoSection from "./_components/demo-section";
import TestimonialsSection from "./_components/testimonals";
import PricingSection from "./_components/pricing";
import FaqSection from "./_components/faq";
import Footer from "./_components/footer";
import BackgroundGradient from "./_components/bg-gradient";
import LaunchBanner from "./_components/launch-banner";
import CtaSection from "./_components/cta";
import FooterCta from "./_components/footer-cta";
import SubscriptionPlansDisplay from "@/components/payments/subscription-plans-display";
import { signOut } from "next-auth/react";

export default function LandingPage() {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

 

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  useEffect(()=>{
    handleAutomaticSignOut()
  },[])

   const handleAutomaticSignOut = async () => {
      await signOut({ redirect: false })
    }

  return (
    <BackgroundGradient className="min-h-screen bg-background">
      
      <div>
        <Header />
        <main>
          <div className="mt-16">
          <LaunchBanner/> 
          </div>
        
          <HeroSection />
          <FeaturesSection />
          <DemoSection />
          <TestimonialsSection />
          {/* <PricingSection /> */}
          <SubscriptionPlansDisplay/>
          <FaqSection />
          <CtaSection/>
          <FooterCta/>
        </main>
        <Footer />
      </div>
    </BackgroundGradient>
  );
}
