import { Message, Channel } from "discord.js";
import RoleBot from "../src/bot";
import roles from "../commands/events/roles";
import commands from "../commands/callable/commands";

export default (client: RoleBot, message: Message) => {
  const { guild } = message;
  const { id } = guild || { id: "" };

  // Ignore bots
  if (message.author.bot) return;

  const channel: Channel | undefined = message.channel;
  const role_channel = client.roleChannels.get(id) || "";

  const mention = message.mentions.users.first();

  // Someone is trying to request a role (hopefully)
  if (channel.id === role_channel) {
    roles(message);
  } else if (mention && mention.id === client.user!.id) {
    const length: number = message.content.split(" ")[0].length;
    // + 1 for the damn space.
    const [command, ...args] = message.content.substring(length + 1).split(" ");

    // Allow users to mention the bot only, this will return the list of commands in a private message
    if (!command) return commands.run(message, args, client);

    //If the command isn't in the big ol' list.
    if (
      !client.commands.has(command.toLowerCase()) ||
      (!guild && command.toLowerCase() !== "help")
    )
      return console.log("Command DNE");

    // Find the command and run it.
    client.commands.get(command.toLowerCase())!.run(message, args, client);
  }
};
