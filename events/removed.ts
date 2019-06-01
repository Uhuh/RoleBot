import { Guild } from "discord.js"
import { removeJoinRoles, removeRoleChannel, removeRoles } from "../src/setup_table"

export default (guild: Guild) => {
  console.log(`Removed from ${guild.name}`)

  removeJoinRoles.run(guild.id)
  removeRoleChannel.run(guild.id)
  removeRoles.run(guild.id)
}