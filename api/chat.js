import { handleChat } from "../lib/chat.js";
import { vercelRoute } from "../lib/vercel.js";

export default vercelRoute(handleChat);
