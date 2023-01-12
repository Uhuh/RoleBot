import { displayOrderQuery } from '../../../utilities/utils';
import { Category, ReactRole } from '../entities';
import { DisplayType, ICategory } from '../entities/category.entity';

// Guild categories
export const GET_GUILD_CATEGORIES = async (guildId: string) => {
  return await Category.find({ where: { guildId }, order: { name: 'ASC' } });
};

export const GET_ROLES_BY_CATEGORY_ID = async (
  guildId: string,
  categoryId: number,
  displayType: DisplayType
) => {
  const orderProperties = displayOrderQuery(displayType);

  return await ReactRole.find({
    where: { category: { guildId, id: categoryId } },
    order: orderProperties,
  });
};

export const CREATE_GUILD_CATEGORY = async (
  category: Omit<ICategory, 'id'>
) => {
  const newCategory = new Category();

  newCategory.guildId = category.guildId;
  newCategory.name = category.name;
  newCategory.description = category.description ?? '';
  newCategory.mutuallyExclusive = category.mutuallyExclusive ?? false;
  newCategory.requiredRoleId = category.requiredRoleId;
  newCategory.excludedRoleId = category.excludedRoleId;
  newCategory.displayOrder = category.displayOrder;

  return await newCategory.save();
};

export const EDIT_CATEGORY_BY_ID = (
  guildId: string,
  id: number,
  category: Partial<ICategory>
) => {
  return Category.update({ guildId, id }, category);
};

export const GET_CATEGORY_BY_NAME = async (guildId: string, name: string) => {
  return await Category.findOne({ where: { guildId, name } });
};

export const GET_CATEGORY_BY_ID = (guildId: string, id: number) => {
  return Category.findOne({ where: { guildId, id } });
};

export const DELETE_CATEGORY_BY_ID = (guildId: string, id: number) => {
  return Category.delete({ guildId, id });
};
