"use client";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative inline-flex items-center">
      <Switch
        checked={theme === "light"}
        className="h-10 w-20 pl-1 data-[state=checked]:bg-muted-foreground"
        onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Toggle dark mode"
      />
      {/* Moon Icon */}
      <Moon
        className="absolute left-2 top-1/2 h-5 w-5 -translate-y-1/2 fill-white transition-opacity duration-300 ease-in-out
        data-[state=checked]:opacity-100 data-[state=unchecked]:opacity-50 pointer-events-none"
        data-state={theme === "light" ? "checked" : "unchecked"}
      />

      {/* Sun Icon */}
      <Sun
        className="absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 stroke-gray-600 fill-black transition-opacity duration-300 ease-in-out
        data-[state=checked]:opacity-0 data-[state=unchecked]:opacity-100 pointer-events-none"
        data-state={theme === "light" ? "checked" : "unchecked"}
      />
    </div>
  );
};

export default ThemeSwitcher;
