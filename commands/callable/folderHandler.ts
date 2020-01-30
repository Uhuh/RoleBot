import { Message, Collection } from "discord.js"
import RoleBot, { Command } from "../../src/bot"
import * as logger from "log-to-file"

const folderHandler = {
  desc: "Create folders that can separate roles into different categories.",
  name: "folder",
  args: "\n",
  type: "reaction",
  commands: new Collection<string, Command>(),
  run: (message: Message, args: string[], client: RoleBot) => {
    const command = args[0];
    args.shift();

    //If the command isn't in the big ol' list.
    const clientCommand = folderHandler.commands.get(command);
    if (!clientCommand)
      return console.log("Folder command DNE");

    try {
      // Find the command and run it.
      clientCommand.run(message, args, client);
    } catch(e) {
      logger(`Error occurred trying to run folder command: ${e}`, 'errors.log')
    }
  }
}

export default folderHandler;