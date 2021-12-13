import RoleBot from '../src/bot';
import { Interaction } from 'discord.js';
import { LogService } from '../src/services/logService';
import { SelectService } from '../src/services/selectService';

export const handleInteraction = async (
  interaction: Interaction,
  client: RoleBot
) => {
  if (SelectService.isSelectMenu(interaction)) {
    return SelectService.parseSelection(interaction, client);
  }

  if (!interaction.isCommand()) return;
  LogService.setPrefix('InteractionCreate');

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    command.run(interaction);
  } catch (error) {
    LogService.error(
      `Encountered an error trying to run command[${command.name}] for guild[${interaction.guildId}]\n\t\t${error}\n`
    );

    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  }
};
