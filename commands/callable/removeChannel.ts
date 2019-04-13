import { Message, Guild } from "discord.js"
import { removeChannel } from "../../src/setup_table"

export default {
  desc:
    "Channel will no longer be pruned of messages and bot will not hand out roles from channel anymore.",
  name: "removeChannel",
  args: "<channel mention>",
  run: (message: Message) => {
    const guild: Guild = message.guild
    const roleChannel = message.mentions.channels.first()

    if (!roleChannel) return message.react("❌")

    removeChannel.run(`${guild.id}-${roleChannel.id}`, roleChannel.id)
    return message.react("✅")
  }
}
