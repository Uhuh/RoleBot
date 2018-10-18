import Bowsette from "../src/bot"
import { Message, Guild } from "discord.js"

 export default {
  alias: ['deleteroles', 'delete'], 
  run: (message: Message, args: string[], client: Bowsette) => {
    // ignore them plebians
    if (!message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])) return message.reply("no stop");

    message.reply('sure hope you wanted to do this.')
    client.deleteRoles.run(message.guild.id)
    message.react("✅")

  }
}