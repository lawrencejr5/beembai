import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Automatically sync live FX market rates every 6 hours
crons.interval(
  "refresh live exchange rates",
  { hours: 6 },
  internal.exchangeRates.syncLiveRates,
  {}
);

export default crons;
