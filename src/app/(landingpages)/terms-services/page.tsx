"use client";

import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
// import type { Metadata } from "next";

// export const metadata: Metadata = {
//   title: "Terms of Service | Skroub",
//   description:
//     "Terms of Service for Skroub, a service provided by Bootstrap Hub",
// };

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function TermsOfServicePage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-20">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="space-y-10"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground text-sm">
            Last Updated: April 18, 2024
          </p>
        </div>

        {/* Sections */}
        {sections.map((section, index) => (
          <motion.div key={index} variants={fadeUp}>
            <Card className="shadow-md rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-2xl font-semibold text-center">{section.title}</h2>
                {section.subtitle && (
                  <h3 className="text-xl font-medium">{section.subtitle}</h3>
                )}
                {section.content.map((item, i) =>
                  typeof item === "string" ? (
                    <p key={i}>{item}</p>
                  ) : (
                    <ul key={i} className="list-disc pl-6 space-y-1 text-sm">
                      {item.map((li, j) => (
                        <li key={j}>{li}</li>
                      ))}
                    </ul>
                  )
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}

        <motion.div variants={fadeUp}>
          <Card className="shadow-md rounded-2xl">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-2xl font-semibold text-center">Contact Us</h2>
              <p>If you have any questions about these Terms, please contact us at:</p>
              <div>
                <p className="font-bold">
                  Skroub{" "}
                  <span className="text-sm font-light text-muted-foreground">
                    by Bootstrap Hub
                  </span>
                </p>
                <p>Email: support@skroub.com</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

const sections = [
  {
    title: "Introduction",
    content: [
      `Welcome to Skroub ("Service"), a product provided by Bootstrap Hub ("Company," "we," "our," or "us"). By accessing or using our Service, you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these Terms, you may not access the Service.`,
    ],
  },
  {
    title: "Definitions",
    content: [
      [
        "Service: The Skroub platform, website, and all related services provided by Bootstrap Hub.",
        "User: Any individual or entity that accesses or uses the Service.",
        "Account: A registered profile created to access and use the Service.",
        "Content: Any information, data, text, software, graphics, or other materials that can be accessed through the Service.",
        "User Data: Information collected from or provided by Users during the use of the Service.",
      ],
    ],
  },
  {
    title: "Account Registration and Security",
    subtitle: "Account Creation",
    content: [
      `To use certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.`,
    ],
  },
  {
    title: "",
    subtitle: "Account Security",
    content: [
      `You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. We encourage you to use "strong" passwords (passwords that use a combination of upper and lowercase letters, numbers, and symbols) with your account.`,
    ],
  },
  {
    title: "Acceptable Use",
    content: [
      `You agree not to use the Service to:`,
      [
        "Violate any applicable laws or regulations",
        "Infringe upon the rights of others",
        "Engage in unauthorized access to any part of the Service",
        "Transmit any viruses, malware, or other harmful code",
        "Interfere with or disrupt the integrity or performance of the Service",
        "Collect or harvest any information from the Service without authorization",
        "Impersonate any person or entity",
        "Engage in any activity that could harm our reputation",
      ],
    ],
  },
  {
    title: "Intellectual Property",
    subtitle: "Our Intellectual Property",
    content: [
      `The Service and its original content, features, and functionality are and will remain the exclusive property of Bootstrap Hub and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.`,
    ],
  },
  {
    title: "",
    subtitle: "Your Content",
    content: [
      `You retain all rights to any content you submit, post, or display on or through the Service. By submitting, posting, or displaying content on or through the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute such content in connection with providing the Service.`,
    ],
  },
  {
    title: "Subscription and Billing",
    subtitle: "Fees and Payment",
    content: [
      `Some aspects of the Service may be provided for a fee. You will be required to select a payment plan and provide accurate billing information. By submitting such information, you grant us the right to provide the information to third parties for purposes of facilitating payment.`,
    ],
  },
  {
    title: "",
    subtitle: "Subscription Terms",
    content: [
      `Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period. You can cancel your subscription at any time through your account settings.`,
    ],
  },
  {
    title: "",
    subtitle: "Refunds",
    content: [
      `Refunds are provided at our discretion and in accordance with our refund policy, which may be updated from time to time.`,
    ],
  },
  {
    title: "Termination",
    content: [
      `We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms.`,
      `Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service or contact us to request account deletion.`,
    ],
  },
  {
    title: "Limitation of Liability",
    content: [
      `In no event shall Bootstrap Hub, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:`,
      [
        "Your access to or use of or inability to access or use the Service",
        "Any conduct or content of any third party on the Service",
        "Any content obtained from the Service",
        "Unauthorized access, use, or alteration of your transmissions or content",
      ],
    ],
  },
  {
    title: "Disclaimer",
    content: [
      `Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.`,
    ],
  },
  {
    title: "Governing Law",
    content: [
      `These Terms shall be governed and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.`,
    ],
  },
  {
    title: "Changes to Terms",
    content: [
      `We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.`,
    ],
  },
];
