import { Schema, Document, Model, model } from 'mongoose';

const ReactMessage = new Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  categoryId: { type: Number },
  messageId: { type: String, required: true },
});

export interface IReactMessage {
  guildId: string;
  categoryId?: number;
  messageId: string;
}

export interface IReactMessageDoc extends IReactMessage, Document {}
export interface IReactMessageModel extends Model<IReactMessageDoc> {}
export default model<IReactMessageDoc>('ReactMessage', ReactMessage);
