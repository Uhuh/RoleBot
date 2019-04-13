import { Message, Guild } from "discord.js"
import { addChannel } from "../../src/setup_table"

export default {
  desc:
    "Makes a channel the role channel. Bot will prune messages and assign roles from this channel.",
  name: 'roleChannel',
  args: "<channel mention>",
  run: (message: Message) => {
    const roleChannel = message.mentions.channels.first()
    if (
      !roleChannel ||
      !message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])
    )
      return message.react("❌")

    const guild: Guild = message.guild
    addChannel.run({
      id: `${guild.id}-${roleChannel.id}`,
      channel_id: roleChannel.id,
      guild: guild.id
    })
    return message.react("✅")
  }
}
