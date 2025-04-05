"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, Mail, MessageSquare, FileText, ExternalLink } from "lucide-react"

// Define interfaces for our data types
interface FaqItem {
  id: string
  question: string
  answer: string
  category: "general" | "agents" | "billing" | "technical"
}

// Hardcoded data
const faqItems: FaqItem[] = [
  {
    id: "1",
    question: "What is rSlashMiner?",
    answer:
      "rSlashMiner is a Reddit monitoring tool that helps businesses identify potential customers, track market trends, and gather insights from Reddit communities. It uses AI to analyze Reddit content and notify you when relevant discussions are happening.",
    category: "general",
  },
  {
    id: "2",
    question: "How do agents work?",
    answer:
      "Agents are automated monitors that track specific subreddits for keywords and phrases you define. Each agent can monitor multiple subreddits and track multiple keywords. When a match is found, the agent analyzes the content for relevance to your business and notifies you based on your notification settings.",
    category: "agents",
  },
  {
    id: "3",
    question: "Is rSlashMiner compliant with Reddit's terms of service?",
    answer:
      "Yes, rSlashMiner operates within Reddit's API guidelines and terms of service. We respect rate limits and follow all required policies to ensure ethical data collection.",
    category: "general",
  },
  {
    id: "4",
    question: "How accurate is the sentiment analysis?",
    answer:
      "Our sentiment analysis uses advanced NLP models with an accuracy rate of over 85%. We continuously train and improve our models to better understand Reddit's unique language patterns and context.",
    category: "technical",
  },
  {
    id: "5",
    question: "Can I export the data for use in other tools?",
    answer:
      "Yes, Pro and Premium plans include data export functionality in CSV, JSON, and Excel formats, making it easy to integrate with your existing workflows and tools.",
    category: "technical",
  },
  {
    id: "6",
    question: "How far back does the historical data go?",
    answer:
      "Free plans provide data from the past 30 days. Pro plans extend to 6 months, and Premium plans offer up to 2 years of historical data, subject to Reddit's API limitations.",
    category: "technical",
  },
  {
    id: "7",
    question: "How do I upgrade my subscription?",
    answer:
      "You can upgrade your subscription by going to Settings > Subscription and selecting the plan that best fits your needs. You can pay via credit card or PayPal.",
    category: "billing",
  },
  {
    id: "8",
    question: "What's the difference between the subscription tiers?",
    answer:
      "Free tier includes basic monitoring with 1 agent and 100 monitoring requests per day. Pro tier ($29/month) includes 3 agents, 500 requests per day, and additional features like data export and advanced analytics. Premium tier ($99/month) includes unlimited agents, unlimited requests, and all premium features.",
    category: "billing",
  },
  {
    id: "9",
    question: "How do I create a new agent?",
    answer:
      "To create a new agent, go to the Agents page and click 'Create Agent'. Follow the step-by-step process to define your business details, select subreddits to monitor, add keywords, and set up notification preferences.",
    category: "agents",
  },
  {
    id: "10",
    question: "Can I pause an agent temporarily?",
    answer:
      "Yes, you can pause and resume agents at any time. When paused, the agent will stop monitoring and won't use your daily monitoring requests.",
    category: "agents",
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredFaqs, setFilteredFaqs] = useState<FaqItem[]>(faqItems)
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      setFilteredFaqs(faqItems)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = faqItems.filter(
      (item) => item.question.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query),
    )

    setFilteredFaqs(filtered)
  }

  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setContactForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleContactFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would send the form data to a backend API
    alert("Thank you for your message! Our support team will get back to you soon.")
    setContactForm({
      name: "",
      email: "",
      subject: "",
      message: "",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Help & Support</h1>
        <p className="text-muted-foreground">Find answers to common questions or contact our support team</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for help..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" className="absolute right-1 top-1">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue="faq" className="space-y-4">
        <TabsList>
          <TabsTrigger value="faq">Frequently Asked Questions</TabsTrigger>
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Find answers to the most common questions about rSlashMiner</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="agents">Agents</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger>{faq.question}</AccordionTrigger>
                        <AccordionContent>{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>

                <TabsContent value="general">
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqs
                      .filter((faq) => faq.category === "general")
                      .map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id}>
                          <AccordionTrigger>{faq.question}</AccordionTrigger>
                          <AccordionContent>{faq.answer}</AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                </TabsContent>

                <TabsContent value="agents">
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqs
                      .filter((faq) => faq.category === "agents")
                      .map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id}>
                          <AccordionTrigger>{faq.question}</AccordionTrigger>
                          <AccordionContent>{faq.answer}</AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                </TabsContent>

                <TabsContent value="technical">
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqs
                      .filter((faq) => faq.category === "technical")
                      .map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id}>
                          <AccordionTrigger>{faq.question}</AccordionTrigger>
                          <AccordionContent>{faq.answer}</AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                </TabsContent>

                <TabsContent value="billing">
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqs
                      .filter((faq) => faq.category === "billing")
                      .map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id}>
                          <AccordionTrigger>{faq.question}</AccordionTrigger>
                          <AccordionContent>{faq.answer}</AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>Have a question or need help? Our support team is here for you.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Email Support</h3>
                      <p className="text-sm text-muted-foreground">
                        Send us an email at{" "}
                        <a href="mailto:support@rslashminer.com" className="text-primary hover:underline">
                          support@rslashminer.com
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Live Chat</h3>
                      <p className="text-sm text-muted-foreground">
                        Chat with our support team during business hours (9am-5pm EST)
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 mt-6">
                    <h3 className="font-medium mb-2">Support Hours</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Monday - Friday</div>
                      <div>9:00 AM - 5:00 PM EST</div>
                      <div>Saturday</div>
                      <div>10:00 AM - 2:00 PM EST</div>
                      <div>Sunday</div>
                      <div>Closed</div>
                    </div>
                  </div>
                </div>

                <div>
                  <form onSubmit={handleContactFormSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Your name"
                        value={contactForm.name}
                        onChange={handleContactFormChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Your email"
                        value={contactForm.email}
                        onChange={handleContactFormChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="subject" className="text-sm font-medium">
                        Subject
                      </label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="How can we help?"
                        value={contactForm.subject}
                        onChange={handleContactFormChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium">
                        Message
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Please describe your issue in detail"
                        rows={5}
                        value={contactForm.message}
                        onChange={handleContactFormChange}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Send Message
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
              <CardDescription>Helpful resources to get the most out of rSlashMiner</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-medium">User Guide</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Comprehensive guide to using all features of rSlashMiner
                    </p>
                    <Button variant="outline" className="w-full" asChild>
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Guide
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-medium">API Documentation</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Technical documentation for integrating with our API
                    </p>
                    <Button variant="outline" className="w-full" asChild>
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Docs
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-medium">Video Tutorials</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Step-by-step video guides for using rSlashMiner
                    </p>
                    <Button variant="outline" className="w-full" asChild>
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Watch Videos
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-medium">Best Practices</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Tips and strategies for getting the most out of rSlashMiner
                    </p>
                    <Button variant="outline" className="w-full" asChild>
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Read Guide
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-medium">Case Studies</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Real-world examples of how businesses use rSlashMiner to grow their business
                    </p>
                    <Button variant="outline" className="w-full" asChild>
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Case Studies
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-medium">Changelog</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Latest updates and new features added to rSlashMiner
                    </p>
                    <Button variant="outline" className="w-full" asChild>
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Updates
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

