import Bowsette from "../src/bot"
import { Message, Guild } from "discord.js"

 export default {
  alias: ['role', 'addrole'], 
  run: (message: Message, args: string[], client: Bowsette) => {
    let role: any = {}
    const guild: Guild = message.guild
    if (guild && args.length === 3 && guild.roles.find(val => (val.name.toLowerCase() === args[1].toLowerCase() && val.id === args[2])) && 
       (args[0] === 'sec' || args[0] === 'prim')) 
    {
      role = {
        id: `${guild.id}-${args[2]}`,
        role_name: args[1],
        role_id: args[2],
        guild: guild.id,
        prim_role: (args[0] === 'prim' ? 1 : 0)
      }
      client.addRole.run(role)
      message.react("✅")
      return
    }
    message.react("❌")
  }
}