import RoleBot from "../src/bot"
import * as fs from "fs"

export default (client: RoleBot) => {
  const helpCommands: string[] = []
  fs.readdirSync("commands/callable/").forEach(file =>
    helpCommands.push(file.slice(0, -3))
  )

  for (const file of helpCommands) {
    const command = require(`./callable/${file}`)
    client.commands.set(command.default.name.toLowerCase(), command.default)
  }
}
