import { Guild } from "discord.js"
import { removeJoinRoles, removeRoleChannel, removeRoles } from "../src/setup_table"
import * as logger from "log-to-file";

export default (guild: Guild) => {
  logger(`Removed from guild: ${guild.name} - ${guild.id}`, 'guilds.log')

  removeJoinRoles.run(guild.id)
  removeRoleChannel.run(guild.id)
  removeRoles.run(guild.id)
}