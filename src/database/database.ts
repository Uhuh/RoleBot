import CategoryModel from './category';
import ConfigModel from './guild';
import MessageModel from './reactMessage';
import ReactModel from './reactRole';

// React role related
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

export const DELETE_REACT_ROLE_BY_ROLE_ID = (roleId: string) => {
  return ReactModel.findOneAndDelete({ roleId });
};

export const GET_REACT_ROLES_BY_GUILD = (guildId: string) => {
  return ReactModel.find({ guildId });
};

export const GET_REACT_ROLES_NOT_IN_CATEGORIES = (guildId: string) => {
  return ReactModel.find({ guildId, categoryId: undefined });
};

export const GET_REACT_ROLE_BY_ROLE_ID = (_id: string) => {
  return ReactModel.findOne({ _id });
};

export const GET_REACT_ROLE_BY_EMOJI = (emojiId: string, guildId: string) => {
  return ReactModel.findOne({ emojiId, guildId });
};

// React role messages
export const GET_ALL_REACT_MESSAGES = () => {
  return MessageModel.find({});
};

export const GET_ALL_JOIN_ROLES = () => {
  return ConfigModel.find().select('guildId joinRoles -_id');
};

// Guild categories
export const GET_GUILD_CATEGORIES = (guildId: string) => {
  return CategoryModel.find({ guildId });
};

export const GET_ALL_GUILD_CATEGORIES = () => {
  return CategoryModel.find();
};

export const GET_ROLES_BY_CATEGORY_ID = (categoryId: string) => {
  return ReactModel.find({ categoryId });
};

export const CREATE_GUILD_CATEGORY = (
  guildId: string,
  name: string,
  description: string | undefined
) => {
  return CategoryModel.create({
    guildId,
    name,
    description,
  });
};

export const GET_CATEGORY_BY_NAME = (guildId: string, name: string) => {
  return CategoryModel.findOne({ guildId, name });
};

export const GET_CATEGORY_BY_ID = (_id: string) => {
  return CategoryModel.findOne({ _id });
};

export const DELETE_CATEGORY_BY_ID = (_id: string) => {
  return CategoryModel.findOneAndDelete({ _id });
};
