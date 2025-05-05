"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoPlayer from "./video-player";
import { useRouter } from "next/navigation";

export default function DemoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const router = useRouter();

  return (
    <section id="demo" className="container px-4 md:px-6 mx-auto mt-16">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
          >
            See Skroub in Action
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Watch how our AI agents extract valuable data from Reddit in
            real-time
          </motion.p>
        </div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={
            isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }
          }
          transition={{ duration: 0.7 }}
          className="relative max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl flex flex-row"
        >
          <div className="aspect-auto bg-muted relative">
            {/* This would be replaced with an actual video player */}
            <VideoPlayer
              src="/demo-video.mp4"
              poster="/demo-thumbnail.png"
              className="aspect-auto rounded-xl shadow-2xl"
            />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 text-center flex flex-col items-center justify-between space-x-3 mb-5"
        >
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Our demo showcases how Skroub can help you discover relevant
            information, track trends, and gain insights from Reddit data.
          </p>
          <Button
            size="lg"
            className="px-8"
            onClick={() => router.push("/signup")}
            disabled
          >
            Try It Yourself
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
