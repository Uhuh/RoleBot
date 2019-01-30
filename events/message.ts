import { Message, Channel } from "discord.js";
import RoleBot from "../src/bot";
import roles from "../commands/events/roles";
import { getChannel } from "../src/setup_table";

export default (client: RoleBot, message: Message) => {
  // Ignore bots.
  if (message.author.bot) return;

  const channel: Channel | undefined = message.channel;
  const role_channel: String = getChannel.get(message.guild.id, channel.id)
    ? getChannel.get(message.guild.id, channel.id).channel_id
    : "";

  // Someone is trying to request a role (hopefully)
  if (channel.id === role_channel) {
    roles(message);
  } else if (message.guild && message.mentions.members.has(client.user.id)) {
    const length: number =
      message.content.indexOf(client.config.PREFIX) === 0
        ? client.config.PREFIX.length
        : message.content.split(" ")[0].length;
    // + 1 for the damn space.
    const [command, ...args] = message.content.substring(length + 1).split(" ");
    //If the command isn't in the big ol' list.
    if (!client.commands.has(command.toLowerCase()))
      return console.log("Command DNE");
    // Find the command and run it.
    client.commands.get(command.toLowerCase())!.run(message, args);
  }
};
