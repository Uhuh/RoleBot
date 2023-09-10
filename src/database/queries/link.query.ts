import { LinkedRole, ReactRole } from '../entities';

export const GET_LINKED_ROLES = (reactRoleId: number) => {
  return LinkedRole.find({ where: { roleId: '1' } });
};

export const CREATE_LINKED_ROLES = async (guildId: string, roleId: string, reactRole: ReactRole) => {
  const linkedRole = new LinkedRole();

  linkedRole.roleId = roleId;
  linkedRole.guildId = guildId;

  reactRole.linkedRoles = [...(reactRole.linkedRoles ?? []), linkedRole];

  return ReactRole.save(reactRole);
};

export const FIND_ROLE_IN_LINK = (reactRoleId: number, roleId: string) => {
  return LinkedRole.count({ where: { roleId } });
};

export const GET_GUILDS_LINKED_ROLES = (guildId: string) => {
  return LinkedRole.find({ where: { guildId } });
};