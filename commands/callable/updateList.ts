import {getChannel, addChannel} from "../../src/setup_table";
import roleList from "./roleList";
import {Message} from "discord.js";

export default {
  desc: "Updates the role list in the set role channel.\nE.G: `@RoleBot update #roles`",
  name: "update",
  args: "<role channel mention>",
  type: "message",
  run: (message: Message) => {
    if(!message.guild) return

    const role_channel = message.mentions.channels.first()
    const channel = getChannel(message.guild.id)[0]

    if (!channel)
      return message.channel.send(`There is no role channel set.\nRun \`@RoleBot rolechannel <channel mention>\` to setup a role channel.`)
    if (!role_channel || channel.channel_id !== role_channel.id)
      return message.react("❌")

    // Delete the current role message so we can send a new one.
    role_channel.messages.fetch(channel.message_id)
      .then(msg => msg.delete())
      .catch((err) => console.log(`Couldn't delete message: ${err}`))

    return roleList.run(message, role_channel)!
      .then((msg) => {
        addChannel.run({
          id: channel.id,
          channel_id: channel.channel_id,
          guild: channel.guild,
          message_id: msg.toString()
        })
      })
      .catch(console.error)
  }
}