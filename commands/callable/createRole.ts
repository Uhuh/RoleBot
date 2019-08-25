import {Message} from 'discord.js'

export default {
    desc: 'Create a role for assignment',
    name: 'createRole',
    args: '<role name> [color]',
    run: async ({guild, member}: Message, [roleName, ...flags]: string[]) => {
        if (!member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])) return
		// handle creating duplicate roles        
        return guild.createRole({name: roleName, mentionable: flags.includes('mention')}).catch(console.error)
    }
}
