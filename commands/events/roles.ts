import { Message } from "discord.js";
import { getRoles } from "../../src/setup_table";
export default async function(message: Message) {
  const member = message.member;
  const role = message.content;
  const guildRoles = getRoles.all(message.guild.id);
  let addedRole: boolean = false;
  let req_role: string = "";
  
  // IF they already have the role, remove it.
  const roleToRemove = member.roles.find(val => val.name.toLowerCase() === role.toLowerCase())
  if (roleToRemove) {
    return member.removeRole(roleToRemove)
      .then(member => console.log(`Removed ${roleToRemove.name} from ${member.displayName}`))
  }
  // Make sure the server has the role to give.
  for (const gR of guildRoles) {
    if (gR.role_name && gR.role_name.toLowerCase() === role.toLowerCase()) {
      req_role = role.toLowerCase();
      addedRole = await member
      .addRole(gR.role_id)
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
      // if a secondary role don't remove previously given role.
      if (gR.prim_role === 0) {
        return;
      }
      break;
    }
    // No need to loop again if role was granted.
    if (addedRole) break;
  }
  for (const [k, role] of member.roles) {
    for (const gR of guildRoles) {
      if (
        gR.role_name.toLowerCase() === role.name.toLowerCase() &&
        role.name.toLowerCase() !== req_role &&
        addedRole &&
        gR.prim_role == 1
        ) {
          member.removeRole(k);
          return;
        }
      }
    }
    message.delete();
  }
  