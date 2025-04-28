"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";

export default function LaunchBanner() {
  const [seatsLeft, setSeatsLeft] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const router = useRouter();

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/user");
      const data = await response.json();
      setSeatsLeft(25-data.users.length)

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch agents");
      }
    } catch (error) {
        console.error("Failed to fetch users")
        setIsVisible(false)
    } 
  };

  useEffect(() => {
      fetchUsers();
  }, []);

  if (!isVisible) return null;

  return (
    <div className="sticky top-0 z-50 bg-orange-500 text-white py-3 px-4 w-full rounded-sm">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between">
        <div className="flex items-center mb-2 sm:mb-0">
          <span className="mr-2 text-primary">
            <Wand2/>
          </span>
          <p className="text-sm sm:text-base text-primary">
            Founding-member price – first 25 seats only | Seats left:{" "}
            <strong>{seatsLeft}</strong>
          </p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-1 right-1 text-primary/80 hover:text-white"
          aria-label="Close banner"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}
