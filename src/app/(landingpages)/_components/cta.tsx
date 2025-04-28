"use client";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import FooterCta from "./footer-cta";

export default function CtaSection() {
  return (
    <section className="py-20 bg-transparent text-muted-foreground">
      <div className="px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center gap-8 max-w-3xl mx-auto"
        >
          {/* Final CTA */}
          <section className="py-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              Ready to meet tomorrow's customers—today?
            </h2>
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg rounded-lg"
            >
              Start Finding Leads Now →
            </Button>
            <p className="mt-4 text-gray-600">
              Risk-free · 60-second setup · Founding-member pricing
            </p>
          </section>

          {/* Sticky Footer */}
          <FooterCta />
        </motion.div>
      </div>
    </section>
  );
}
