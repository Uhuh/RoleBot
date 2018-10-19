import Bowsette from "../src/bot";
import { Message } from "discord.js";

export default {
  alias: ['counter', 'messages'],
  run: async function(message: Message, args: string[], client: Bowsette) {
    const userCount = client.getMessageCount.all(message.channel.id, message.guild.id)
    let name: string = ""
    // Just output each user tracked, waiting to find a good chart to use to make a diagram
    for(const user of userCount) {
      name = message.guild.members.get(user.user)!.nickname || message.guild.members.get(user.user)!.user.username
      message.channel.send(`${name} has sent ${user.count} message${user.count>1?'s':''} in ${message.guild.channels.get(user.channel_id)!.name}`)
    }
  }
}