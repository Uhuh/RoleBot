import RoleBot, { Command } from '../src/bot';
import * as fs from 'fs';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { TOKEN } from '../src/vars';

const rest = new REST({ version: '9' }).setToken(TOKEN);

export default (client: RoleBot) => {
  const categoryCommands: string[] = [];
  const slashGenerators: string[] = [];

  const commandsJson: any = [];

  fs.readdirSync('commands/category-slash-commands/').forEach((file) =>
    categoryCommands.push(file.slice(0, -3))
  );

  fs.readdirSync('commands/slashGenerators/').forEach((file) =>
    slashGenerators.push(file.slice(0, -3))
  );

  for (const file of categoryCommands) {
    const command: {
      command: Command;
    } = require(`./category-slash-commands/${file}`);
    client.commands.set(command.command.name.toLowerCase(), command.command);
  }

  for (const file of slashGenerators) {
    const command = require(`./slashGenerators/${file}`);
    commandsJson.push(command.default.toJSON());
  }

  console.log(commandsJson);

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
