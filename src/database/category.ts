import { Schema, Document, Model, model } from 'mongoose';
import { IReactRole } from './reactRole';

const Category = new Schema({
  guildId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, maxlength: 1024, default: '' },
  roles: { type: [Object] },
});

export interface ICategory {
  guildId: string;
  name: string;
  description: string;
  roles: IReactRole[];
}

export interface ICategoryDoc extends ICategory, Document {}
export interface ICategoryModel extends Model<ICategoryDoc> {}
export default model<ICategoryDoc>('Category', Category);
