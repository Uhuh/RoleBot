import Bowsette from "../src/bot"
import { Message, Guild } from "discord.js"

 export default {
  alias: ['deleteRoles'], 
  run: (message: Message, args: string[], client: Bowsette) => {
    // ignore them plebians
    if (!message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])) return;

    message.reply('sure hope you wanted to do this.')
    client.deleteRoles.run(message.guild.id)
    message.react("✅")
    
  }
}