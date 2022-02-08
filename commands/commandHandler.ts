import RoleBot from '../src/bot';
import { REST } from '@discordjs/rest';
import {
  RESTPostAPIApplicationCommandsJSONBody,
  Routes,
} from 'discord-api-types/v9';
import { CLIENT_ID, TOKEN } from '../src/vars';
import { LogService } from '../src/services/logService';
import * as categoryCommands from './category';
import * as generalCommands from './general';
import * as reactionCommands from './react';

const rest = new REST({ version: '9' }).setToken(TOKEN);

export default (client: RoleBot) => {
  const log = new LogService('SlashCommandHandler');
  log.info(`Loading all slash commands...`);

  const commandsJson: RESTPostAPIApplicationCommandsJSONBody[] = [];

  // Use the slash commands name generated from their data.
  for (const cmd of [
    ...Object.values(generalCommands).map((c) => new c(client)),
    ...Object.values(categoryCommands).map((c) => new c(client)),
    ...Object.values(reactionCommands).map((c) => new c(client)),
  ]) {
    client.commands.set(cmd.data.name.toLowerCase(), cmd);
    commandsJson.push(cmd.data.toJSON());
  }

  // Deleting global commands. (:
  //deleteSlashCommands();

  // Generate global slash commands
  generateSlashCommands(commandsJson);
};

async function generateSlashCommands(
  commandsJson: RESTPostAPIApplicationCommandsJSONBody[]
) {
  const log = new LogService('GenerateSlashCommands');
  // Make a request to Discord to create all the slash commands.
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commandsJson,
    });
    log.info(`Created slash commands successfully.`);
  } catch (e) {
    log.error(`Errored when trying to create slash commands.\n${e}\n`);
  }
}

/**
 * I just need a simple way to delete all the stupid global commands.
 */
async function deleteSlashCommands() {
  const log = new LogService('DeleteSlashCommands');

  try {
    rest.get(Routes.applicationCommands(CLIENT_ID)).then((data) => {
      const promises = [];
      //@ts-ignore
      for (const command of data) {
        promises.push(
          rest.delete(`${Routes.applicationCommands(CLIENT_ID)}/${command.id}`)
        );
      }

      console.log(data);
      return Promise.all(promises);
    });
  } catch (e) {
    log.error(`Errored when trying to delete global slash commands.\n${e}\n`);
  }
}
