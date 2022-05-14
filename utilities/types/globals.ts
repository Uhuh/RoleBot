import { WebhookClient } from 'discord.js';
import { WEBHOOK_ID, WEBHOOK_TOKEN } from '../../src/vars';
// Discord embed sidebar colors.
export enum COLOR {
  DEFAULT = 15158332,
  RED = 16711684,
  YELLOW = 15844367,
  GREEN = 3066993,
  AQUA = 2025424,
}

// Because of sharding we can't reliably get the guild channel. Also this is actually so much easier!
export const RolebotEventsWebhook = new WebhookClient({
  id: WEBHOOK_ID,
  token: WEBHOOK_TOKEN,
});
