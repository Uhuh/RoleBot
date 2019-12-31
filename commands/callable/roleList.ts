import { Message, RichEmbed, Role, TextChannel } from "discord.js";
import { getRoles, deleteRole, getJoinRoles } from "../../src/setup_table";

export default {
  desc: "Retrieves the list of roles that your server hands out.",
  name: "list",
  args: "",
  type: "message",
  run: (message: Message, roleChannel?: TextChannel) => {
    const GUILD_ID = message.guild.id;
    const DB_ROLES = getRoles(GUILD_ID).map(role => role.role_name);
    const J_ROLES = getJoinRoles(GUILD_ID);
    const embed = new RichEmbed();
    const GUILD_ROLES: string[] = [];
    const PRIM_ROLES: Role[] = [];
    const SEC_ROLES: Role[] = [];
    const JOIN_ROLES: Role[] = [];

    // If the DB has roles that the guild doesn't then the guild deleted them
    message.guild.roles.forEach(role => GUILD_ROLES.push(role.name));
    const DELETED_ROLES = DB_ROLES.filter(role => !GUILD_ROLES.includes(role));

    for (const role of DELETED_ROLES) {
      deleteRole.run(GUILD_ID, role);
    }
    // Just deleted some old roles so lets get this updated.
    const UPDATED_ROLES = getRoles(GUILD_ID);

    for (const [key, role] of message.guild.roles) {
      const r = UPDATED_ROLES.find(r => r.role_id === key);
      const jR = J_ROLES.find(r => r.role_id === key);

      if (r && r.prim_role === 1) {
        PRIM_ROLES.push(role);
      } else if (r && r.prim_role === 0) {
        SEC_ROLES.push(role);
      }
      if (jR) {
        JOIN_ROLES.push(role);
      }
    }

    PRIM_ROLES.length === 0 && SEC_ROLES.length === 0
      ? embed.setDescription(`**No roles to assign**`)
      : embed
          .setDescription(`**Assignable Roles**`)
          .addField(
            `What to do`,
            `Send the roles name. EG: \`Role\` not \`@Role\``,
            true
          );
    PRIM_ROLES.length > 0
      ? embed.addField(`_**PRIMARY ROLES**_`, `${PRIM_ROLES.join(" ")}`)
      : null;
    SEC_ROLES.length > 0
      ? embed.addField(`_**SECONDARY ROLES**_`, `${SEC_ROLES.join(" ")}`)
      : null;

    embed.setColor(0xe229e2);

    if (roleChannel instanceof TextChannel) return roleChannel.send(embed);
    return message.channel.send(embed);
  }
};
