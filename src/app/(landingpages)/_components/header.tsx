"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, Slash, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Add scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-background/95 backdrop-blur-md"
          : "bg-background/10"
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500">
              <Slash className="h-5 w-5 text-black" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
              Skroub
            </span>
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="#features"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Features
          </Link>
          <Link
            href="#demo"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Demo
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="#faq"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            FAQ
          </Link>
          {/* <Button asChild variant="outline" className="ml-2">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up Free</Link>
          </Button> */}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMobile && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: mobileMenuOpen ? "auto" : 0,
            opacity: mobileMenuOpen ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden bg-background border-b"
        >
          <div className="container py-4 flex flex-col gap-4 px-4">
            <Link
              href="#features"
              className="text-sm font-medium hover:text-primary py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#demo"
              className="text-sm font-medium hover:text-primary py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Demo
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium hover:text-primary py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium hover:text-primary py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            {/* TODO - We need to revoke once the website is  */}
            {/* <div className="flex flex-col gap-2 pt-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  Login
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  Sign Up Free
                </Link>
              </Button>
            </div> */}
          </div>
        </motion.div>
      )}
    </header>
  );
}
