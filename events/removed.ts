import { Guild } from "discord.js"
import { removeJoinRoles, removeRoleChannel, removeRoles, removeReactRoles, removeReactMsg } from "../src/setup_table"
import * as logger from "log-to-file";

export default (guild: Guild) => {
  logger(`Removed - { guildId: ${guild.id}, guildName: ${guild.name}, ownerId: ${guild.ownerID}, numMembers: ${guild.memberCount}}`, 'guilds.log')

  removeJoinRoles(guild.id)
  removeRoleChannel(guild.id)
  removeRoles(guild.id)
  removeReactRoles(guild.id)
  removeReactMsg(guild.id)
}