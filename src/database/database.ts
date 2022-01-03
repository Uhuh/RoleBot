import CategoryModel, { ICategory } from './category';
import ConfigModel from './guild';
import MessageModel, { IReactMessage } from './reactMessage';
import ReactModel from './reactRole';

// React role related
export const CREATE_REACT_ROLE = (
  name: string,
  roleId: string,
  emojiId: string,
  guildId: string
) => {
  return ReactModel.create({
    roleId,
    name,
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

export const GET_REACT_ROLES_BY_CATEGORY_ID = (categoryId: string) => {
  return ReactModel.find({ categoryId });
};

export const GET_REACT_ROLE_BY_EMOJI = (emojiId: string, guildId: string) => {
  return ReactModel.findOne({ emojiId, guildId });
};

export const UPDATE_REACT_ROLE_CATEGORY = (_id: string, categoryId: string) => {
  return ReactModel.findOneAndUpdate({ _id }, { categoryId });
};

// React role messages
export const SAVE_MSG_REACT = (reactMessage: IReactMessage) => {
  return MessageModel.create({
    ...reactMessage,
  });
};

export const GET_ALL_REACT_MESSAGES = () => {
  return MessageModel.find({});
};

export const GET_ALL_JOIN_ROLES = () => {
  return ConfigModel.find().select('guildId joinRoles -_id');
};

export const GET_REACT_MSG = (messageId: string, emojiId: string) => {
  return MessageModel.findOne({ messageId, emojiId });
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

export const EDIT_CATEGORY_BY_ID = (
  _id: string,
  category: Partial<ICategory>
) => {
  return CategoryModel.findOneAndUpdate({ _id }, { ...category });
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
