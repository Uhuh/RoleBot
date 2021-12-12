import { Schema, Document, Model, model } from 'mongoose';
import { IReactRole } from './reactRole';

const Category = new Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, maxlength: 1024 },
  categoryId: { type: Number, required: true },
  roles: { type: [Object], required: true },
});

export interface ICategory {
  guildId: string;
  name: string;
  description: string;
  categoryId: number;
  roles: IReactRole[];
}

export interface ICategoryDoc extends ICategory, Document {}
export interface ICategoryModel extends Model<ICategoryDoc> {}
export default model<ICategoryDoc>('Category', Category);
