import { CommandInteraction, Permissions } from 'discord.js-light';
import RoleBot from '../../src/bot';
import {
  CREATE_GUILD_CATEGORY,
  GET_CATEGORY_BY_NAME,
} from '../../src/database/database';
import { Category } from '../../utilities/types/commands';
import { handleInteractionReply } from '../../utilities/utils';
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
      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `Hey! It says you submitted no category name! You need to submit that. Please try again.`,
      });
    } else if (categoryName.length > 90) {
      // Discord max embed title is 100 so let's be safe and make it smaller.
      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `Hey! Discord only allows 100 characters max for their embed titles. Try making the category name simple and make the rest the category description!`,
      });
    }

    if (await GET_CATEGORY_BY_NAME(interaction.guildId, categoryName)) {
      return handleInteractionReply(this.log, interaction, `Hey! It turns out you already have a category with that name made. Try checking it out.`);
    }

    CREATE_GUILD_CATEGORY(
      interaction.guildId,
      categoryName,
      categoryDesc,
      !!mutuallyExclusive
    )
      .then(() => {
        this.log.info(
          `Successfully created category[${categoryName}]`,
          interaction.guildId
        );
        handleInteractionReply(this.log, interaction, `Hey! I successfully created the category \`${categoryName}\` for you!`);
      })
      .catch((e) => {
        this.log.error(
          `Issue creating category[${categoryName}]\n${e}`,
          interaction.guildId
        );
        handleInteractionReply(this.log, interaction, `Hey! I had some trouble creating that category for you. Please wait a minute and try again.`);
      });
  };
}
