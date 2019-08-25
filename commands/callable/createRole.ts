import {Message} from 'discord.js'

export default {
    desc: 'Create a role for assignment',
    name: 'createRole',
    args: '<role name> [color]',
    run: async ({guild, member}: Message, [roleName, color = '']: string[]) => {
        if (!member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])) return
        
        return guild.createRole({name: roleName, color})
    }
}