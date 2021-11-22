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
import * as slashGenerators from './slashGenerators';

const rest = new REST({ version: '9' }).setToken(TOKEN);

export default (client: RoleBot) => {
  LogService.setPrefix('SlashCommandHandler');
  LogService.logInfo(`Loading all slash commands...`);

  const commandsJson: RESTPostAPIApplicationCommandsJSONBody[] = [];

  // Category commands don't have the data object since they depend on categorySlashGenerator
  for (const cmd of Object.values(categoryCommands)) {
    client.commands.set(cmd.name.toLowerCase(), cmd);
  }

  // Use the slash commands name generated from their data.
  for (const cmd of [
    ...Object.values(generalCommands),
    ...Object.values(reactionCommands),
  ]) {
    client.commands.set(cmd.data.name.toLowerCase(), cmd);
  }

  // Generate the JSON to send to the Discord SlashCommand API
  for (const cmd of [
    ...Object.values(generalCommands).map((c) => c.data),
    ...Object.values(reactionCommands).map((c) => c.data),
    ...Object.values(slashGenerators),
  ]) {
    commandsJson.push(cmd.toJSON());
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
      LogService.logOk(`Created slash commands successfully.`);
    } catch (e) {
      LogService.logError(
        `Errored when trying to create slash commands.\n${e}\n`
      );
    }
  })();
};
