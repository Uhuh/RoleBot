import RoleBot from '../src/bot';
import * as fs from 'fs';

export default (client: RoleBot) => {
  const helpCommands: string[] = [];
  const reactCommands: string[] = [];
  const folderCommands: string[] = [];

  fs.readdirSync('commands/callable/').forEach((file) =>
    helpCommands.push(file.slice(0, -3))
  );
  fs.readdirSync('commands/reactCommands/').forEach((file) => {
    if (file !== 'cmds') reactCommands.push(file.slice(0, -3));
  });
  fs.readdirSync('commands/folderCommands/').forEach((file) => {
    if (file !== 'cmds') folderCommands.push(file.slice(0, -3));
  });

  for (const file of helpCommands) {
    const command = require(`./callable/${file}`);
    client.commands.set(command.default.name.toLowerCase(), command.default);
  }

  for (const file of reactCommands) {
    const command = require(`./reactCommands/${file}`);
    client.commands.set(command.default.name, command.default);
  }

  for (const file of folderCommands) {
    const command = require(`./folderCommands/${file}`);
    client.commands.set(command.default.name, command.default);
  }
};
