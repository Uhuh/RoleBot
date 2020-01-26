import RoleBot, { ReactCommand } from "../src/bot"
import * as fs from "fs"

export default (client: RoleBot) => {
  const helpCommands: string[] = []
  fs.readdirSync("commands/callable/").forEach(file =>
    helpCommands.push(file.slice(0, -3))
  )

  for (const file of helpCommands) {
    const command = require(`./callable/${file}`)
    if(command.default.name === "reaction") loadCommands(command.default)
    client.commands.set(command.default.name.toLowerCase(), command.default)
  }
}

const loadCommands = (reactionHandler: ReactCommand) => {
  const reactCommands: string[] = []
  fs.readdirSync("commands/reactCommand/").forEach(file =>
    reactCommands.push(file.slice(0, -3))
  )

  for (const file of reactCommands) {
    const command = require(`./reactCommand/${file}`);
    reactionHandler.commands.set(command.default.name, command.default);
    console.log("COMMAND: " + command.default.name)
    reactionHandler.args += (`\t\t\t\t\t${command.default.name} ${command.default.args}\n`);
  }
}