import { Schema, Document, Model, model } from 'mongoose';

interface IFolder {
  id: number;
  label: string;
  roleIds: string[];
}

interface IRoleEmoji {
  folderId: string;
  emojiId: string;
  roleId: string;
}

interface IReactMessage {
  messageId: string;
  channelId: string;
}

const ReactRole = new Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  folders: {
    type: [],
    default: [],
  },
  reactRoles: {
    type: [],
    default: [],
  },
  reactMessage: {
    type: [],
    default: [],
  },
});

export interface IReactRole {
  guildId: string;
  folders: IFolder[];
  reactRoles: IRoleEmoji[];
  reactMessage: IReactMessage[];
}

export interface IReactRoleDoc extends IReactRole, Document {}
export interface IReactRoleModel extends Model<IReactRoleDoc> {}
export default model<IReactRoleDoc>('ReactRole', ReactRole);
