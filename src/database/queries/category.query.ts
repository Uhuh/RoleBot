import { displayOrderQuery } from '../../../utilities/utils';
import { Category, ReactRole } from '../entities';
import { DisplayType, ICategory } from '../entities/category.entity';

// Guild categories
export const GET_GUILD_CATEGORIES = async (guildId: string) => {
  return await Category.find({ where: { guildId }, order: { name: 'ASC' } });
};

export const GET_ROLES_BY_CATEGORY_ID = async (
  categoryId: number,
  displayType: DisplayType
) => {
  const orderProperties = displayOrderQuery(displayType);

  return await ReactRole.find({
    where: { category: { id: categoryId } },
    order: orderProperties,
  });
};

export const CREATE_GUILD_CATEGORY = async (
  category: Omit<ICategory, 'id'>
) => {
  const newCategory = new Category();

  newCategory.guildId = category.guildId;
  
  // Embed contents
  newCategory.name = category.name;
  newCategory.description = category.description ?? '';
  
  // React role display / settings
  newCategory.mutuallyExclusive = category.mutuallyExclusive ?? false;
  newCategory.requiredRoleId = category.requiredRoleId;
  newCategory.excludedRoleId = category.excludedRoleId;
  newCategory.displayOrder = category.displayOrder;

  // Embed customization
  newCategory.imageType = category.imageType;
  newCategory.imageUrl = category.imageUrl;
  newCategory.embedColor = category.embedColor;

  return await newCategory.save();
};

export const EDIT_CATEGORY_BY_ID = (
  id: number,
  category: Partial<ICategory>
) => {
  return Category.update({ id }, category);
};

export const GET_CATEGORY_BY_NAME = async (guildId: string, name: string) => {
  return await Category.findOne({ where: { guildId, name } });
};

export const GET_CATEGORY_BY_ID = (id: number) => {
  return Category.findOne({ where: { id } });
};

export const DELETE_CATEGORY_BY_ID = (id: number) => {
  return Category.delete({ id });
};
