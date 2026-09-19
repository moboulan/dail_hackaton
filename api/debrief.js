import { handleDebrief } from "../lib/debrief.js";
import { vercelRoute } from "../lib/vercel.js";

export default vercelRoute(handleDebrief);
