import { Schema, Document, Model, model } from 'mongoose';

const ReactRole = new Schema({
  guildId: { type: BigInt, required: true, unique: true, index: true },
});

export interface IReactRole {
  guildId: BigInt;
}

export interface IReactRoleDoc extends IReactRole, Document {}
export interface IReactRoleModel extends Model<IReactRoleDoc> {}
export default model<IReactRoleDoc>('ReactRole', ReactRole);
