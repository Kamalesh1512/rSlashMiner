// cron/index.ts

import dotenv from "dotenv";
dotenv.config();


import { initializeScheduler } from "@/lib/agents/cronScheduler";

console.log("🚀 Starting cron scheduler...");
initializeScheduler();
