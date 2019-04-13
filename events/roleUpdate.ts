import { Role } from "discord.js";
import { getRoles, getJoinRoles, addRole, joinRoles } from "../src/setup_table";

export default (role: Role) => {
  const roles = getRoles.all(role.guild.id)
  const JoinRoles = getJoinRoles.all(role.guild.id)
  const roleIDs = roles.map(role => role.role_id)
  const joinIDS = JoinRoles.map(role => role.role_id)

  if(roleIDs.includes(role.id)) {
    const r = roles.find(r => r.role_id === role.id)
    console.log(`Role: Updating ${r.role_name} to ${role.name}`)
    addRole.run({
      id: r.id,
      role_name: role.name,
      prim_role: r.prim_role,
      guild: r.guild,
      role_id: r.role_id,
    })
  }
  else if(joinIDS.includes(role.id)) {
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