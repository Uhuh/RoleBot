import { Role } from 'discord.js';

import RoleBot from '../src/bot';
import { deleteRole, reactionById, updateRoleNames } from '../src/setup_table';

export const roleDelete = (role: Role, client: RoleBot) => {
  // Delete from the DB
  deleteRole(role.id);
  // Check for it in join roles.
  const joinRoles = client.joinRoles.get(role.guild.id);
  const joinToDelete = joinRoles?.find((r) => r.id === role.id);
  // Check reaction roles.
  const reactToDelete = reactionById(role.id);

  // Make sure it exist instead of killing the bot
  if (joinToDelete && joinRoles?.length) {
    client.joinRoles.set(
      role.guild.id,
      joinRoles.splice(joinRoles.indexOf(joinToDelete), 1)
    );
  }

  if (reactToDelete) {
    const folder = client.folderContents.get(Number(reactToDelete.folder_id));
    // If it's not in a folder then the deleteRole function above took care of it.
    if (!folder) return;
    folder.roles.splice(folder.roles.indexOf(reactToDelete), 1);
  }
};

export const roleUpdate = (oldRole: Role, newRole: Role, client: RoleBot) => {
  // If the name didn't change we don't care.
  if (oldRole.name === newRole.name) return;
  // Update the DB with the new name.
  updateRoleNames(newRole.id, newRole.name);
  // Grab the join role
  const joinRole = client.joinRoles
    .get(newRole.guild.id)
    ?.find((r) => r.role_id === newRole.id);

  let reactRole = null;

  // Search for a possible reaction role.
  for (const [, folder] of client.folderContents) {
    reactRole = folder.roles.find((r) => r.role_id === newRole.id);
    if (reactRole) break;
  }

  // Make sure they exist.
  if (joinRole) joinRole.role_name = newRole.name;
  if (reactRole) reactRole.role_name = newRole.name;
};
