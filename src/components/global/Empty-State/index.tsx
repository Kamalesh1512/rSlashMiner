'use client'

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  onNewChat: () => void
}

export function EmptyState({ onNewChat }: EmptyStateProps) {
  const examples = [
    "Explain quantum computing in simple terms",
    "Got any creative ideas for a 10 year old's birthday?",
    "How do I make an HTTP request in Javascript?"
  ]

  return (
    <motion.div 
      className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] gap-8 px-4 py-12 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">ChatGPT</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          How can I help you today?
        </p>
      </div>
      
      <div className="grid gap-4 w-full max-w-4xl md:grid-cols-3">
        <div className="col-span-full md:col-span-1">
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">Examples</h2>
            {examples.map((example, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
              >
                <Button 
                  variant="outline" 
                  className="justify-between w-full text-left h-auto py-3"
                  onClick={onNewChat}
                >
                  <span className="text-sm mr-2 line-clamp-2">{example}</span>
                  <ArrowRight className="size-4 shrink-0" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="col-span-full md:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-full">
              <h2 className="text-sm font-medium mb-3">Capabilities</h2>
            </div>
            <motion.div
              className="col-span-1 p-4 rounded-lg border border-border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Sparkles className="size-5 mb-2" />
              <p className="text-sm">
                Remembers what user said earlier in the conversation
              </p>
            </motion.div>
            <motion.div
              className="col-span-1 p-4 rounded-lg border border-border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Sparkles className="size-5 mb-2" />
              <p className="text-sm">
                Allows user to provide follow-up corrections
              </p>
            </motion.div>
            <motion.div
              className="col-span-1 p-4 rounded-lg border border-border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Sparkles className="size-5 mb-2" />
              <p className="text-sm">
                Trained to decline inappropriate requests
              </p>
            </motion.div>
            <motion.div
              className="col-span-1 p-4 rounded-lg border border-border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <Sparkles className="size-5 mb-2" />
              <p className="text-sm">
                Limited knowledge of world and events after 2021
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}