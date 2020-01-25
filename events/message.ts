import { Message, Channel } from "discord.js";
import RoleBot from "../src/bot";
import roles from "../commands/events/roles";
import commands from "../commands/callable/commands";

export default (client: RoleBot, message: Message): void => {
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
  } else if (mention && client.user && mention.id === client.user.id) {
    const length: number = message.content.split(" ")[0].length;
    // + 1 for the damn space.
    const [command, ...args] = message.content.substring(length + 1).split(" ");

    // Allow users to mention the bot only, this will return the list of commands in a private message
    if (!command) {
      commands.run(message, args, client);
      return;
    }

    //If the command isn't in the big ol' list.
    const clientCommand = client.commands.get(command.toLowerCase());
    if (
      !clientCommand ||
      (!guild && command.toLowerCase() !== "help")
    )
      return console.log("Command DNE");

    // Find the command and run it.
    clientCommand.run(message, args, client);
  }
};
