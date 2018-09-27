import Bowsette from "../src/bot"
import { Message, Guild } from "discord.js"

 export default {
  alias: ['rc', 'addChannel'], 
  run: (message: Message, args: string[], client: Bowsette) => {
    let channel: any = {}
    const guild: Guild = message.guild
    if (args.length == 1 && guild.channels.find(val => val.id === args[0])) 
    {
      channel = {
        id: `${guild.id}-${args[0]}`,
        channel_id: args[0],
        guild: guild.id,
      }
      client.addChannel.run(channel)
      message.react("✅")
      return
    }
    message.channel.send("❌")
  }
}