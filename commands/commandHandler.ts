import RoleBot from '../src/bot';
import { REST } from '@discordjs/rest';
import {
  RESTPostAPIApplicationCommandsJSONBody,
  Routes,
} from 'discord-api-types/v9';
import { TOKEN } from '../src/vars';
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

  // Make a request to Discord to create all the slash commands.
  (async () => {
    try {
      await rest.put(
        Routes.applicationGuildCommands(
          client.user?.id || '',
          '647960154079232041'
        ),
        {
          body: commandsJson,
        }
      );
      log.info(`Created slash commands successfully.`);
    } catch (e) {
      log.error(`Errored when trying to create slash commands.\n${e}\n`);
    }
  })();
};
