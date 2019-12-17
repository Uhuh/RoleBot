import { Message, Guild } from "discord.js"
import { removeChannel, getChannel } from "../../src/setup_table"

export default {
  desc:
    "Channel will no longer be pruned of messages and bot will not hand out roles from channel anymore.\nE.G: `@RoleBot removeChannel #roles`",
  name: "removeChannel",
  args: "<channel mention>",
  run: (message: Message) => {
    if (!message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"]))
      return message.react("❌")

    const guild: Guild = message.guild
    const channel = getChannel(message.guild.id)[0]
    const roleChannel = message.mentions.channels.first()

    /**
     * Ignore if no role channel exist, make sure they also mention the right channel
     */
    if (!channel || !roleChannel 
        || roleChannel.id !== channel.channel_id) 
      return message.react("❌")
    
    if(channel.message_id) roleChannel.fetchMessage(channel.message_id).then(msg => msg.delete())
    removeChannel.run(guild.id)
    
    return message.react("✅")
  }
}
