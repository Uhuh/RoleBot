import { Message } from "discord.js";

function sleep(ms: number = 0) {
  return new Promise(r => setTimeout(r, ms));
}

export default {
  alias: ['tag'],
  run: async (message: Message) => {
    let keys = Array.from(message.guild.members.keys())
    const member = message.guild.members.get(keys[Math.floor(Math.random() * keys.length)])
    message.channel.send(":thinking:...")
    await sleep(1000)
    message.channel.send(`${member!.user} tag; you're it!`)
  }
}