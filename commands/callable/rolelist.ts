import { Message, RichEmbed, Role } from "discord.js";
import { getRoles, deleteRole } from "../../src/setup_table";

export default {
  desc: "Retrives the list of roles that your server hands out.",
  name: "list",
  args: "",
  run: (message: Message) => {
    const DB_ROLES = getRoles.all(message.guild.id).map(role => role.role_name);
    const embed = new RichEmbed();
    const GUILD_ID = message.guild.id;
    const GUILD_ROLES: string[] = []
    const PRIM_ROLES: Role[] = []
    const SEC_ROLES: Role[] = []

    // If the DB has roles that the guild doesn't then the guild deleted them
    message.guild.roles.forEach(role => GUILD_ROLES.push(role.name))
    const DELETED_ROLES = DB_ROLES.filter(role => !GUILD_ROLES.includes(role))
    
    for(const role of DELETED_ROLES) {
      deleteRole.run(GUILD_ID, role)
    }
    // Just deleted some old roles so lets get this updated.
    const UPDATED_ROLES = getRoles.all(GUILD_ID);

    for(const [key, role] of message.guild.roles) {
      let r = UPDATED_ROLES.find(r => r.role_name === role.name);
      if(r && r.prim_role) {
        PRIM_ROLES.push(role);
      }
      else if(r) {
        SEC_ROLES.push(role);
      }
    }

    embed
      .setColor(0xE229E2)
      .setDescription(`**Assignable Roles**`)
      .addField(`_**PRIMARY ROLES**_`, 
                `${PRIM_ROLES.length > 0 ?
                   PRIM_ROLES.join("\n") : 
                   "No primary roles to give."}`)
      .addField(`_**SECONDARY ROLES**_`,
                `${SEC_ROLES.length > 0 ?
                  SEC_ROLES.join("\n") :
                  "No secondary roles to give."}`);

    message.channel.send(embed);
  }
};
