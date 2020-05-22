import { Role, MessageEmbed } from "discord.js"
import { guildReactions } from "../src/setup_table";

export default (role: Role) => {
  const { guild } = role
  const REACT_ROLES = guildReactions(guild.id);
  const embed = new MessageEmbed();

  embed.setTitle(`**Server Roles**`);
  embed.setColor("#cffc03");

  if(REACT_ROLES.length > 0) {
    embed.setDescription(
      REACT_ROLES.map(
        r => `${guild!.emojis.cache.get(r.emoji_id) || r.emoji_id} - ${r.role_name}`
      )
    );
  }
  else
    embed.setDescription(`There are no reaction roles`)
  
}