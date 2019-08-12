import { Guild } from "discord.js"
import { removeJoinRoles, removeRoleChannel, removeRoles } from "../src/setup_table"
import * as logger from "log-to-file";

export default (guild: Guild) => {
  logger(`Removed - { guildId: ${guild.id}, guildName: ${guild.name}, ownerId: ${guild.ownerID}, numMembers: ${guild.memberCount}}`, 'guilds.log')

  removeJoinRoles.run(guild.id)
  removeRoleChannel.run(guild.id)
  removeRoles.run(guild.id)
}