import { Message, RichEmbed, TextChannel } from "discord.js";
import { guildReactions } from "../../src/setup_table";

export default {
  desc: "All emojis associated with a role",
  name: "reactlist",
  args: "",
  run: (message: Message, roleChannel?: TextChannel) => {
    const GUILD_ID = message.guild.id;
    const REACT_ROLES = guildReactions(GUILD_ID);
    const embed = new RichEmbed();

    embed.setTitle(`**Server Roles**`);
    embed.setColor("#cffc03");

    if(REACT_ROLES.length > 0) {
      embed.setDescription(
        REACT_ROLES.map(
          r => `${message.guild.emojis.get(r.emoji_id) || r.emoji_id} - ${r.role_name}`
        )
      );
    }
    else
      embed.setDescription(`There are no reaction roles`)

    if (roleChannel instanceof TextChannel) return roleChannel.send(embed);
    return message.channel.send(embed);
  }
};
