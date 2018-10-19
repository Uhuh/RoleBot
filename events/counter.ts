import Bowsette from "../src/bot"
import { Message } from "discord.js";

export default (client: Bowsette, message: Message) => {
  let userMessage = {
    id: `${message.author.id}-${message.guild.id}`,
    user: message.author.id,
    channel_id: message.channel.id,
    count: 0,
    guild: message.guild.id
  }
  client.updateMessageCounter.run(userMessage)
}