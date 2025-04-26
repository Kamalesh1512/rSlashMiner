"use client"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, Search, Bot, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import BackgroundGradient from "./bg-gradient"
import Link from "next/link"
import Slideshow from "./slide-show"
import { useRouter } from "next/navigation"

export default function HeroSection() {

  const router = useRouter()
  return (
      <div className="container px-4 md:px-6 mx-auto">
         <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 mt-32"
          >
            <Badge variant="outline" className="px-4 py-1 border-primary/30 bg-primary/5 text-primary">
              Introducing Skroub AI
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400"
          >
            Turn Searches into Business Leads, <span className="bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">Intelligently</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl"
          >
            Skroub uses AI to find, analyze, and deliver the most relevant information from Reddit and beyond, tailored
            to your specific needs.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 mb-12"
          >
            <Button size="lg" className="text-base px-8 h-12" onClick={()=>router.push('/signup')}>
              Start For Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Link href={'/#demo'}>
            <Button size="lg" variant="outline" className="text-base px-8 h-12">
              Watch Demo
            </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="relative w-full max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl border aspect-[16/9]"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-orange-500/10 pointer-events-none z-10" />

            {/* Dashboard slideshow */}
            <Slideshow />

            {/* Floating elements */}
            {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="absolute top-8 right-8 bg-background/90 backdrop-blur-sm p-4 rounded-lg border shadow-lg z-20"
            >
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-primary" />
                <span className="font-medium">Intelligent Data Extraction</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="absolute bottom-8 left-8 bg-background/90 backdrop-blur-sm p-4 rounded-lg border shadow-lg z-20"
            >
              <div className="flex items-center gap-3">
                <Bot className="h-5 w-5 text-primary" />
                <span className="font-medium">AI-Powered Analysis</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute bottom-8 right-8 bg-background/90 backdrop-blur-sm p-4 rounded-lg border shadow-lg z-20"
            >
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <span className="font-medium">Customized Results</span>
              </div>
            </motion.div> */}
          </motion.div>

          {/* Stats or social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="flex flex-wrap justify-center gap-8 mt-12 text-muted-foreground"
          >
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-foreground">2,500+</span>
              <span>Active Users</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-foreground">1M+</span>
              <span>Data Points Analyzed</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-foreground">98%</span>
              <span>Accuracy Rate</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-foreground">24/7</span>
              <span>Monitoring</span>
            </div>
          </motion.div>
        </div>
      </div>
  )
}
