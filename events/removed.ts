import { Guild, MessageEmbed, TextChannel } from "discord.js";
/* import {
  removeJoinRoles,
  removeRoleChannel,
  removeRoles,
  removeReactRoles,
  removeReactMsg
} from "../src/setup_table"; */
import * as logger from "log-to-file";
import RoleBot from "../src/bot";

export default (guild: Guild, client: RoleBot) => {
  const G_ID = "567819334852804626";
  const C_ID = "661410527309856827";

  const embed = new MessageEmbed();

  embed
    .setColor(15158332)
    .setTitle("**Left Guild**")
    .setThumbnail(guild.iconURL() || "")
    .setDescription(guild.name)
    .addField("Member size:", guild.memberCount);

  (client.guilds.cache.get(G_ID)!.channels.cache.get(C_ID) as TextChannel).send(
    embed
  );

  logger(
    `Removed - { guildId: ${guild.id}, guildName: ${guild.name}, ownerId: ${guild.ownerID}, numMembers: ${guild.memberCount}}`,
    "guilds.log"
  );

  /* removeJoinRoles(guild.id);
  removeRoleChannel(guild.id);
  removeRoles(guild.id);
  removeReactRoles(guild.id);
  removeReactMsg(guild.id); */
};
