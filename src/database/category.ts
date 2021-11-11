import { Schema, Document, Model, model } from 'mongoose';

const Category = new Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  categoryId: { type: Number, required: true },
});

export interface ICategory {
  guildId: string;
  name: string;
  categoryId: number;
}

export interface ICategoryDoc extends ICategory, Document {}
export interface ICategoryModel extends Model<ICategoryDoc> {}
export default model<ICategoryDoc>('Category', Category);
