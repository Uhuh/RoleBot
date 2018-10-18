import Bowsette from "../src/bot"
import { Message, Guild } from "discord.js"

 export default {
  alias: ['role', 'addrole'], 
  run: (message: Message, args: string[], client: Bowsette) => {
    // ignore them plebians
    if (!message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])) return;

    let role: any = {}
    const regex = new RegExp('[0-9]+') // I'm getting sick of having to grab the id from `\@roleName` so just regex the id out of it when passed in
    const guild: Guild = message.guild
    if (guild && args.length === 3 && guild.roles.find(val => (val.name.toLowerCase() === args[1].toLowerCase() && val.id === regex.exec(args[2])![0])) && 
       (args[0] === 'sec' || args[0] === 'prim')) 
    {
      console.log(regex.exec(args[2])![0])
      role = {
        id: `${guild.id}-${regex.exec(args[2])![0]}`,
        role_name: args[1],
        role_id: regex.exec(args[2])![0],
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