// File: actions/myCoolTsFile.ts
import {
  ActionFn, Context,
  Event, BlockEvent, PeriodicEvent, TransactionEvent, WebhookEvent
} from "@tenderly/actions";

// importing ethers available in Tenderly Runtime
import { ethers } from "ethers";
import { sendMessage } from "./telegramNotifier";
export const runFn: ActionFn = async (context: Context, event: Event) => {
  sendMessage("Hello World");
}
