import { Message } from "discord.js";

export default {
  alias: ['tag'],
  run: async (message: Message) => {
    let keys = Array.from(message.guild.members.keys())
    const member = message.guild.members.get(keys[Math.floor(Math.random() * keys.length)])
    message.channel.send(`@${member!.user.id} tag!`)
  }
}