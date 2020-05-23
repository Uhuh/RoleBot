import { Role } from "discord.js"
import { getJoinRoles, joinRoles } from "../src/setup_table"

export default (role: Role) => {
  const JoinRoles = getJoinRoles(role.guild.id)
  const joinIDS = JoinRoles.map(role => role.role_id)

  if(joinIDS.includes(role.id)) {
    const jR = JoinRoles.find(r => r.role_id === role.id)
    console.log(`Join Role: Updating ${jR.role_name} to ${role.name}`)
    joinRoles.run({
      id: jR.id,
      role_name: role.name,
      role_id: jR.role_id,
      guild_id: jR.guild_id,
    })
  }
}