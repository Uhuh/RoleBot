import RoleBot, { Command } from '../src/bot';
import * as fs from 'fs';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { TOKEN } from '../src/vars';

const rest = new REST({ version: '9' }).setToken(TOKEN);

export default (client: RoleBot) => {
  const categoryCommands: string[] = [];
  const generalCommands: string[] = [];
  const reactionCommands: string[] = [];
  const slashGenerators: string[] = [];

  const commandsJson: any = [];

  // Read all the file names.
  fs.readdirSync('commands/category/').forEach((file) =>
    categoryCommands.push(file.slice(0, -3))
  );

  fs.readdirSync('commands/general/').forEach((file) =>
    generalCommands.push(file.slice(0, -3))
  );

  fs.readdirSync('commands/react/').forEach((file) =>
    reactionCommands.push(file.slice(0, -3))
  );

  fs.readdirSync('commands/slashGenerators/').forEach((file) =>
    slashGenerators.push(file.slice(0, -3))
  );

  // Loop over each file, set the commands and generate their slash JSON.
  for (const file of categoryCommands) {
    const command: {
      command: Command;
    } = require(`./category/${file}`);
    client.commands.set(command.command.name.toLowerCase(), command.command);
  }

  for (const file of generalCommands) {
    const command: {
      command: Command;
    } = require(`./general/${file}`);

    client.commands.set(
      command.command.data.name.toLowerCase(),
      command.command
    );
    commandsJson.push(command.command.data.toJSON());
  }

  for (const file of reactionCommands) {
    const command: {
      command: Command;
    } = require(`./react/${file}`);

    client.commands.set(
      command.command.data.name.toLowerCase(),
      command.command
    );

    commandsJson.push(command.command.data.toJSON());
  }

  for (const file of slashGenerators) {
    const command = require(`./slashGenerators/${file}`);
    commandsJson.push(command.default.toJSON());
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
      console.log(`Created slash commands successfully.`);
    } catch (e) {
      console.error(`Errored when trying to create slash commands. ${e}`);
    }
  })();
};
