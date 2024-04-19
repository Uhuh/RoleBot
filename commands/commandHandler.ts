import { REST } from '@discordjs/rest';
import { Collection, RESTPostAPIApplicationCommandsJSONBody, Routes } from 'discord.js';
import { CLIENT_ID, SERVER_ID, TOKEN } from '../src/vars';
import { LogService } from '../src/services/logService';
import { SlashCommand } from './command';
import * as GeneralBaseCommands from './general';
import { CategoryBaseCommand } from './category';
import { ReactBaseCommand } from './react';

const rest = new REST({ version: '10' }).setToken(TOKEN);

export const commands = () => {
  const log = new LogService('CommandHandler');
  log.info(`Building commands...`);

  const commandMap: Collection<string, SlashCommand> = new Collection();
  const category = new CategoryBaseCommand();
  const react = new ReactBaseCommand();

  commandMap.set(category.name, category);
  commandMap.set(react.name, react);

  for (const cmd of [
    ...Object.values(GeneralBaseCommands).map((c) => new c()),
  ]) {
    if (cmd) commandMap.set(cmd.name, cmd);
  }

  return commandMap;
};

export const buildNewCommands = async (buildCommands = false, beta = false) => {
  if (buildCommands) {
    const log = new LogService('SlashCommandHandler');
    log.info(`Loading all slash commands...`);

    const commandsJson: Array<RESTPostAPIApplicationCommandsJSONBody> = [];
    const category = new CategoryBaseCommand();
    const react = new ReactBaseCommand();

    commandsJson.push(...[category.toJSON(), react.toJSON()]);

    for (const cmd of [
      ...Object.values(GeneralBaseCommands).map((c) => new c()),
    ]) {
      if (cmd) commandsJson.push(cmd.toJSON());
    }

    const route: `/${string}` = beta
      ? Routes.applicationGuildCommands(CLIENT_ID, SERVER_ID)
      : Routes.applicationCommands(CLIENT_ID);

    log.info(`Using route '${route}'`);

    // await deleteSlashCommands(route);
    await generateSlashCommands(route, commandsJson);
  }
};

async function generateSlashCommands(
  route: `/${string}`,
  commandsJson: RESTPostAPIApplicationCommandsJSONBody[],
) {
  const log = new LogService('GenerateSlashCommands');
  // Make a request to Discord to create all the slash commands.
  try {
    const data = (await rest.put(route, {
      body: commandsJson,
    })) as [];

    log.info(`Successfully reloaded ${data?.length} application (/) commands.`);
  } catch (e) {
    log.error(`Errored when trying to create slash commands.\n${e}\n`);
  }
}

/**
 * I just need a simple way to delete all the stupid global commands.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function deleteSlashCommands(route: `/${string}`) {
  const log = new LogService('DeleteSlashCommands');

  try {
    return rest.get(route).then((data) => {
      const promises = [];
      for (const command of data as { id: string }[]) {
        promises.push(rest.delete(`${route}/${command.id}`));
      }

      log.info('Deleting old commands...');

      return Promise.all(promises);
    });
  } catch (e) {
    log.error(`Errored when trying to delete global slash commands.\n${e}\n`);
  }
}
