import Bowsette from "../src/bot"
import { Message, Guild } from "discord.js"

 export default {
  alias: ['remove', 'removeChannel'], 
  run: (message: Message, args: string[], client: Bowsette) => {
    let channel: any = {}
    const guild: Guild = message.guild

    if (args.length == 1 && guild.channels.find(val => val.id === args[0])) 
    {
      client.removeChannel.run(`${guild.id}-${args[0]}`, args[0])
      message.react("✅")
      return
    }
    message.react("❌")
  }
}