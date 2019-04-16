import { Message, Guild } from "discord.js"
import { addChannel, getChannel } from "../../src/setup_table"
import rolelist from "./rolelist";

export default {
  desc:
    "Makes a channel the role channel. Bot will prune messages and assign roles from this channel.",
  name: 'roleChannel',
  args: "<channel mention>",
  run: async (message: Message) => {
    const roleChannel = message.mentions.channels.first()
    if (
      !roleChannel ||
      !message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])
      )
      return message.react("❌")
    const actualChannel = getChannel.get(message.guild.id)

    if(actualChannel && message.guild.channels.get(actualChannel.channel_id)) 
      return message.channel.send(`${message.guild.channels.get(actualChannel.channel_id)!.toString()} is the current role channel.`)
  
    //Send role list to channel so users don't have to
    const roleMessage = await rolelist.run(message, roleChannel) as Message

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
