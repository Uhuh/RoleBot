import { Message, Collection } from "discord.js"
import RoleBot, { Command } from "../../src/bot"
import * as logger from "log-to-file"

const reactionHandler = {
  desc: "Handle your reaction roles using this command.",
  name: "reaction",
  args: "\n",
  type: "reaction",
  commands: new Collection<string, Command>(),
  run: (message: Message, args: string[], client: RoleBot) => {
    const command = args[0];
    args.shift();

    //If the command isn't in the big ol' list.
    const clientCommand = reactionHandler.commands.get(command);
    if (!clientCommand)
      return console.log("Reaction command DNE");

    try {
      // Find the command and run it.
      clientCommand.run(message, args, client);
    } catch(e) {
      logger(`Error occurred trying to run react command: ${e}`, 'errors.log')
    }
  }
}

export default reactionHandler;