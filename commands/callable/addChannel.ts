import { Message, Guild } from "discord.js"
import { addChannel } from "../../src/setup_table"
import roleList from "./roleList";
import RoleBot from "../../src/bot";

export default {
  desc:
    "Bot will prune messages and assign roles from this channel.\nE.G: `@RoleBot rolechannel #roles`",
  name: 'roleChannel',
  args: "<channel mention>",
  run: async (message: Message, client: RoleBot) => {
    const roleChannel = message.mentions.channels.first()
    if (
      !roleChannel ||
      !message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])
      )
      return message.react("❌")

    const actualChannel = client.roleChannels.get(message.guild.id)

    if(actualChannel && message.guild.channels.get(actualChannel)) 
      return message.channel.send(`${message.guild.channels.get(actualChannel)!.toString()} is the current role channel.`)
  
    //Send role list to channel so users don't have to
    const roleMessage = await roleList.run(message, roleChannel) as Message

    const guild: Guild = message.guild
    addChannel.run({
      id: `${guild.id}-${roleChannel.id}`,
      channel_id: roleChannel.id,
      guild: guild.id,
      message_id: roleMessage.id
    })
    
    return message.react("✅")
  }
}
