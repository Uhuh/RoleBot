import { Message } from "discord.js";
import { joinRoles } from "../../src/setup_table";

export default (message: Message, roleName: string) => {
  for (const [key, r] of message.guild.roles) {
    if (r.name === roleName) {
      return joinRoles.run({
        id: `${r.id}-${message.guild.id}`,
        role_name: r.name,
        role_id: r.id,
        guild_id: message.guild.id
      });
    }
  }
  message.guild
    .createRole({
      name: roleName,
      color: "BLUE"
    })
    .then(r => {
      joinRoles.run({
        id: `${r.id}-${message.guild.id}`,
        role_name: r.name,
        role_id: r.id,
        guild_id: message.guild.id
      });
    })
    .catch(e => console.log(e));
};

// check if the role exist
// if not create it and assign to list of join roles.
// if it does make it a join role
// push changes to sql db
