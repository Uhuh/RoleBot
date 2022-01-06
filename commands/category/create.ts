import { CommandInteraction, Permissions } from 'discord.js';
import RoleBot from '../../src/bot';
import {
  CREATE_GUILD_CATEGORY,
  GET_CATEGORY_BY_NAME,
} from '../../src/database/database';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class CreateCategoryCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
      'category-create',
      'Create a new category to categorize your reaction roles in.',
      Category.category,
      [Permissions.FLAGS.MANAGE_ROLES]
    );

    this.addStringOption('category-name', 'The name of the category', true);
    this.addStringOption('category-desc', 'Give your category a description.');
    this.addBoolOption(
      'mutually-exclusive',
      `Make roles from this category mutually exclusive.`
    );
  }

  execute = async (interaction: CommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    const [categoryName, categoryDesc] = this.extractStringVariables(
      interaction,
      'category-name',
      'category-desc'
    );

    const mutuallyExclusive =
      interaction.options.get('mutually-exclusive')?.value;

    if (!categoryName) {
      return interaction
        .reply({
          ephemeral: true,
          content: `Hey! It says you submitted no category name! You need to submit that. Please try again.`,
        })
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    if (await GET_CATEGORY_BY_NAME(interaction.guildId, categoryName)) {
      return await interaction
        .reply(
          `Hey! It turns out you already have a category with that name made. Try checking it out.`
        )
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    CREATE_GUILD_CATEGORY(
      interaction.guildId,
      categoryName,
      categoryDesc,
      !!mutuallyExclusive
    )
      .then(() => {
        this.log.debug(
          `Successfully created category[${categoryName}] for guild[${interaction.guildId}]`
        );
        interaction
          .reply(`Hey! I successfully created the category for you!`)
          .catch((e) => {
            this.log.error(`Interaction failed.`);
            this.log.error(`${e}`);
          });
      })
      .catch((e) => {
        this.log.error(
          `Issue creating category[${categoryName}] for guild[${interaction.guildId}]`
        );
        this.log.error(e);

        interaction
          .reply(
            `Hey! I had some trouble creating that category for you. Please wait a minute and try again.`
          )
          .catch((e) => {
            this.log.error(`Interaction failed.`);
            this.log.error(`${e}`);
          });
      });
  };
}
