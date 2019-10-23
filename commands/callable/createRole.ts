import {Message} from 'discord.js'

export default {
  desc: 'Create a role.',
  name: 'create',
  args: '<role name>',
  run: async (message: Message, roleName: string[]) => {
    if (!message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])) return
    // handle creating duplicate roles
    return message.guild.createRole({name: roleName.join(" ")})
        .then(() => message.react("✅"))
        .catch(console.error)
  }
}
