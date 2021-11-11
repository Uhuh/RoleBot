import { Schema, Document, Model, model } from 'mongoose';

const ReactRole = new Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  roleId: { type: String, required: true },
  roleName: { type: String, required: true },
  /**
   * Emojis can be either a real Id or unicode if it's not a custom emoji on a server
   */
  emojiId: { type: String, required: true },
  categoryId: { type: Number },
});

export interface IReactRole {
  guildId: string;
  roleId: string;
  roleName: string;
  emojiId: string;
  categoryId?: number;
}

export interface IReactRoleDoc extends IReactRole, Document {}
export interface IReactRoleModel extends Model<IReactRoleDoc> {}
export default model<IReactRoleDoc>('ReactRole', ReactRole);
