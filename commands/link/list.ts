import { SlashSubCommand } from '../command';
import { ChatInputCommandInteraction } from 'discord.js';
import { GET_GUILDS_LINKED_ROLES } from '../../src/database/queries/link.query';
import { ReactRole } from '../../src/database/entities';

export class ListSubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(
      baseCommand,
      'list',
      'See all your linked roles.'
    );
  }
  
  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.info(`GuildID missing on interaction.`);
    }

    const linkedRoles = await GET_GUILDS_LINKED_ROLES(interaction.guildId);
    
    const groupedLinkedRoles = new Map<ReactRole, string[]>();
    
    for(const linkedRole of linkedRoles) {
      const ids = groupedLinkedRoles.get(linkedRole.reactRole) ?? [];
      groupedLinkedRoles.set(linkedRole.reactRole, [...ids, linkedRole.roleId]);
    }
    
    console.log(groupedLinkedRoles);
  };
}