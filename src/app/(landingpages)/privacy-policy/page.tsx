"use client"
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";


const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container px-4 md:px-6 mx-auto mt-16 max-w-4xl">
      <motion.div
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.2 }}
        className="flex flex-col gap-8"
      >
        <motion.div variants={sectionVariants} className="text-center">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground">Last Updated: April 18, 2024</p>
        </motion.div>

        <motion.div variants={sectionVariants}>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-2xl font-semibold text-center">Introduction</h2>
              <p>
                Welcome to Skroub ("we," "our," or "us"), a service provided by
                Bootstrap Hub ("Company"). This Privacy Policy explains how we
                collect, use, disclose, and safeguard your information when you
                use our website and services.
              </p>
              <p>
                We are committed to protecting your personal information and
                your right to privacy. If you have any questions about this
                Privacy Policy, please contact us at
                privacy@bootstraphub.com.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={sectionVariants}>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-2xl font-semibold text-center">
                Information We Collect
              </h2>

              <h3 className="text-xl font-medium">Personal Information</h3>
              <p>We may collect personal information you voluntarily provide:</p>
              <ul className="list-disc pl-6">
                <li>Register for an account</li>
                <li>Use our services</li>
                <li>Subscribe to our newsletter</li>
                <li>Contact our support team</li>
                <li>Participate in surveys or promotions</li>
              </ul>
              <p>This includes:</p>
              <ul className="list-disc pl-6">
                <li>Name, email address, password</li>
                <li>Payment and company information</li>
                <li>Usage data, feedback, and survey responses</li>
              </ul>

              <h3 className="text-xl font-medium">
                Automatically Collected Information
              </h3>
              <p>We may collect data like:</p>
              <ul className="list-disc pl-6">
                <li>IP address, browser, OS, and device type</li>
                <li>Usage patterns and referring URLs</li>
                <li>Cookies and tracking technologies</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={sectionVariants}>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-2xl font-semibold text-center">
                How We Use Your Information
              </h2>
              <ul className="list-disc pl-6">
                <li>To provide, maintain, and improve our services</li>
                <li>To process transactions and manage accounts</li>
                <li>To send updates and respond to queries</li>
                <li>To analyze usage and enhance user experience</li>
                <li>To comply with legal obligations and prevent abuse</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={sectionVariants}>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-2xl font-semibold text-center">
                Data Sharing and Disclosure
              </h2>
              <h3 className="text-xl font-medium">Third-Party Service Providers</h3>
              <p>We may share information with vendors like:</p>
              <ul className="list-disc pl-6">
                <li>Payment processors</li>
                <li>Cloud and analytics providers</li>
                <li>Email and support tools</li>
              </ul>

              <h3 className="text-xl font-medium">Legal Requirements</h3>
              <p>We may disclose your data to comply with legal obligations.</p>

              <h3 className="text-xl font-medium">Business Transfers</h3>
              <p>
                If involved in a merger or sale, your information may be
                transferred.
              </p>

              <h3 className="text-xl font-medium">With Your Consent</h3>
              <p>We may share information when you provide consent.</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={sectionVariants}>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-2xl font-semibold text-center">Data Security</h2>
              <p>
                We implement measures to safeguard your information but note no
                method is 100% secure.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={sectionVariants}>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-2xl font-semibold">Your Rights and Choices</h2>
              <ul className="list-disc pl-6">
                <li>Access, correction, or deletion of your data</li>
                <li>Objection to or restriction of processing</li>
                <li>Data portability and consent withdrawal</li>
              </ul>
              <p>Contact: support@skroub.com</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={sectionVariants}>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-2xl font-semibold text-center">
                Children's Privacy
              </h2>
              <p>
                We do not knowingly collect information from children under 16.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={sectionVariants}>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-2xl font-semibold text-center">
                International Data Transfers
              </h2>
              <p>
                Your data may be processed outside your jurisdiction with
                differing privacy laws.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={sectionVariants}>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-2xl font-semibold text-center">
                Changes to This Policy
              </h2>
              <p>
                We may update this policy and will notify you by updating the
                "Last Updated" date.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={sectionVariants}>
          <Card>
            <CardContent className="p-6 space-y-2">
              <h2 className="text-2xl font-semibold text-center">Contact Us</h2>
              <p className="text-center">
                If you have questions, contact us at:
                <br />
                <strong>Skroub</strong> <br />
                <span className="text-sm font-light text-muted-foreground">
                  by Bootstrap Hub
                </span>
                <br />Email: support@skroub.com
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
