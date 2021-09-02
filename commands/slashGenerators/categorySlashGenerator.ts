import { SlashCommandBuilder } from '@discordjs/builders';

const categorySlashObject = new SlashCommandBuilder()
  .setName('category')
  .setDescription('Everything you need to control your servers categories.')
  .addSubcommand((subCommand) =>
    subCommand
      .setName('create')
      .setDescription('Create a new category to store reaction roles in!')
      .addStringOption((option) =>
        option
          .setName('category-name')
          .setDescription('The name of the category.')
          .setRequired(true)
      )
  )
  .addSubcommand((subCommand) =>
    subCommand
      .setName('list')
      .setDescription('List all your categories and the roles they hold!')
  )
  .addSubcommand((subCommand) =>
    subCommand
      .setName('add')
      .setDescription('Add roles to your category to manage the roles easier!')
  )
  .addSubcommand((subCommand) =>
    subCommand.setName('remove').setDescription('Remove a category.')
  );

export default categorySlashObject;
