import Bowsette from "../src/bot"
import { Message, Guild } from "discord.js"

 export default {
  alias: ['role', 'addrole'], 
  run: (message: Message, args: string[], client: Bowsette) => {
    // ignore them plebians
    if (!message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])) return;

    let role: any = {}
    let id: string = args.pop()!
    let primSec = args.shift()
    let name: string = ""

    const regex = new RegExp('[0-9]+') // I'm getting sick of having to grab the id from `\@roleName` so just regex the id out of it when passed in
    const guild: Guild = message.guild
    // So people like putting spaces in the role names, so this just adds them together.
    name = args.join(' ')

    if (guild && guild.roles.find(val => (val.name.toLowerCase() === name.toLowerCase() && val.id === regex.exec(id)![0])) && 
       (primSec === 'sec' || primSec === 'prim')) 
    {
      role = {
        id: `${guild.id}-${regex.exec(id)![0]}`,
        role_name: name,
        role_id: regex.exec(id)![0],
        guild: guild.id,
        prim_role: (primSec === 'prim' ? 1 : 0)
      }
      client.addRole.run(role)
      message.react("✅")
      return
    }
    message.react("❌")
  }
}