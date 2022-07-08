import { JoinRole } from '../entities';

export const CREATE_JOIN_ROLE = async (
  name: string,
  roleId: string,
  guildId: string
) => {
  const joinRole = new JoinRole();

  joinRole.name = name;
  joinRole.roleId = roleId;
  joinRole.guildId = guildId;

  return await joinRole.save();
};

export const DELETE_JOIN_ROLE = async (roleId: string) => {
  return await JoinRole.delete({ roleId });
};

export const GET_GUILD_JOIN_ROLES = async (guildId: string) => {
  return await JoinRole.find({ where: { guildId } });
};

export const GET_JOIN_ROLE_BY_ID = async (roleId: string) => {
  return await JoinRole.find({ roleId });
};
