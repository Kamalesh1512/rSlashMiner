"use client";

import Cta from "./_components/cta";
import Faq from "./_components/faq";
import Features from "./_components/features";
import Footer from "./_components/footer";
import Header from "./_components/header";
import Hero from "./_components/hero";
import HowItWorks from "./_components/how-it-works";
import LogoCloud from "./_components/logo-cloud";
import Pricing from "./_components/pricing";
import ProductShowcase from "./_components/product-showcase";
import Testimonials from "./_components/testimonals";

export default function LandingPage() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <Header />
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Hero />
        {/* <LogoCloud /> */}
        <Features />
        <HowItWorks />
        <ProductShowcase/>
        <Pricing />
        <Testimonials />
        <Faq />
        {/* <Cta /> */}
        <Footer />
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        
      </footer>
    </div>
  );
}
