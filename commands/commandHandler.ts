import RoleBot, { CommandCollection } from "../src/bot"
import * as fs from "fs"

export default (client: RoleBot) => {
  const helpCommands: string[] = []
  fs.readdirSync("commands/callable/").forEach(file =>
    helpCommands.push(file.slice(0, -3))
  )

  for (const file of helpCommands) {
    const command = require(`./callable/${file}`)
    if(command.default.name === "reaction") loadReactCommands(command.default);
    if(command.default.name === "folder") loadFolderCommands(command.default);
    client.commands.set(command.default.name.toLowerCase(), command.default)
  }
}

const loadReactCommands = (reactionHandler: CommandCollection) => {
  const reactCommands: string[] = []
  fs.readdirSync("commands/reactCommands/").forEach(file =>
    reactCommands.push(file.slice(0, -3))
  )

  for (const file of reactCommands) {
    const command = require(`./reactCommands/${file}`);
    reactionHandler.commands.set(command.default.name, command.default);
  }
}

const loadFolderCommands = (folderHandler: CommandCollection) => {
  const folderCommands: string[] = []
  fs.readdirSync("commands/folderCommands/").forEach(file =>
    folderCommands.push(file.slice(0, -3))
  )

  for (const file of folderCommands) {
    const command = require(`./folderCommands/${file}`);
    folderHandler.commands.set(command.default.name, command.default);
  }
}