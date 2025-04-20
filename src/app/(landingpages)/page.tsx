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

  return (
    <BackgroundGradient className="min-h-screen bg-background">
      <div>
        <Header />
        <main>
          <HeroSection />
          <FeaturesSection />
          <DemoSection />
          <TestimonialsSection />
          <PricingSection />
          <FaqSection />
        </main>
        <Footer />
      </div>
    </BackgroundGradient>
  );
}
