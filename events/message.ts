import { Message } from 'discord.js';
import RoleBot from '../src/bot';

export default (client: RoleBot, message: Message): void => {
  const { guild } = message;

  // Ignore bots
  if (message.author.bot) return;

  const mention = message.mentions.users.first();
  const prefix = 'rb';

  // Someone is trying to request a role (hopefully)
  if (
    client.user &&
    ((mention && mention.id === client.user.id) ||
      message.content.startsWith(prefix))
  ) {
    const length: number = message.content.split(' ')[0].length;
    // + 1 for the damn space.
    const [command, ...args] =
      message.content.substring(length + 1).match(/\S+/g) || [];

    //If the command isn't in the big ol' list.
    const clientCommand = client.commands.get(command.toLowerCase());
    if (!clientCommand || (!guild && command.toLowerCase() !== 'help'))
      return console.log('Command DNE');

    client.commandsRun++;

    try {
      // Find the command and run it.
    } catch (e) {}
  }
};
