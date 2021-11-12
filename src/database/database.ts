import { LogService } from '../services/logService';
import CategoryModel from './category';
import ConfigModel from './guild';
import MessageModel from './reactMessage';
import ReactModel from './reactRole';

export const GET_REACT_ROLES_BY_GUILD = (guildId: string) => {
  return ReactModel.find({ guildId });
};

export const GET_REACT_ROLE_BY_EMOJI = (emojiId: string, guildId: string) => {
  return ReactModel.findOne({ emojiId, guildId: guildId });
};

export const GET_ALL_REACT_MESSAGES = () => {
  return MessageModel.find({});
};

export const GET_ALL_JOIN_ROLES = () => {
  return ConfigModel.find().select('guildId joinRoles -_id');
};

export const GET_ALL_GUILD_PREFIXES = () => {
  return ConfigModel.find().select('guildId prefix -_id');
};

export const GET_ALL_GUILD_CATEGORIES = () => {
  return CategoryModel.find();
};

export const GET_ROLES_BY_CATEGORY_ID = (categoryId: number) => {
  return ReactModel.find({ categoryId });
};

export const CREATE_REACT_ROLE = (
  roleName: string,
  roleId: string,
  emojiId: string,
  guildId: string
) => {
  return ReactModel.create({
    roleId,
    roleName,
    emojiId,
    guildId,
  });
};
