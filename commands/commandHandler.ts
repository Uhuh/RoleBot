import { REST } from '@discordjs/rest';
import {
  Collection,
  RESTPostAPIApplicationCommandsJSONBody,
  Routes,
} from 'discord.js';
import { CLIENT_ID, SERVER_ID, TOKEN } from '../src/vars';
import { LogService } from '../src/services/logService';
import * as categoryCommands from './category';
import * as generalCommands from './general';
import * as reactionCommands from './react';
import { SlashCommand } from './slashCommand';
import { SlashCommand as Command } from './commands/command';
import { CategoryBaseCommand } from './commands/category';

const rest = new REST({ version: '10' }).setToken(TOKEN);

export const buildCommands = () => {
  const log = new LogService('CommandHandler');
  log.info(`Building commands...`);

  const commandMap: Collection<string, SlashCommand> = new Collection();
  // Use the slash commands name generated from their data.
  for (const cmd of [
    ...Object.values(generalCommands).map((c) => new c()),
    ...Object.values(categoryCommands).map((c) => new c()),
    ...Object.values(reactionCommands).map((c) => new c()),
  ]) {
    commandMap.set(cmd.data.name.toLowerCase(), cmd);
  }

  return commandMap;
};

export const commands = () => {
  const log = new LogService('CommandHandler');
  log.info(`Building commands...`);

  const commandMap: Collection<string, Command> = new Collection();
  const category = new CategoryBaseCommand();

  commandMap.set(category.name, category);

  return commandMap;
};

export const buildNewCommands = async (buildCommands = false, beta = false) => {
  const log = new LogService('SlashCommandHandler');
  log.info(`Loading all slash commands...`);

  const commandsJson: Array<RESTPostAPIApplicationCommandsJSONBody> = [];
  const category = new CategoryBaseCommand();

  commandsJson.push(category.toJSON());

  if (buildCommands) {
    const route: `/${string}` = beta
      ? Routes.applicationGuildCommands(CLIENT_ID, SERVER_ID)
      : Routes.applicationCommands(CLIENT_ID);

    log.info(`Using route '${route}'`);

    // await deleteSlashCommands(route);
    await generateSlashCommands(route, commandsJson);
  }
};

export const buildSlashCommands = async (
  buildCommands = false,
  beta = false
) => {
  const log = new LogService('SlashCommandHandler');
  log.info(`Loading all slash commands...`);

  const commandsJson: Array<RESTPostAPIApplicationCommandsJSONBody> = [];

  // Use the slash commands name generated from their data.
  for (const cmd of [
    ...Object.values(generalCommands).map((c) => new c()),
    ...Object.values(categoryCommands).map((c) => new c()),
    ...Object.values(reactionCommands).map((c) => new c()),
  ]) {
    commandsJson.push(cmd.data.toJSON());
  }

  if (buildCommands) {
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
  commandsJson: RESTPostAPIApplicationCommandsJSONBody[]
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
