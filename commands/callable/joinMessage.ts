import { Message, Emoji } from "discord.js";
import {addReactionRole, addJoinMessage} from '../../src/setup_table'
import RoleBot from '../../src/bot'

export default {
    desc: 'Create a message with reactions that toggle roole assignment',
    name: 'joinMessage',
    args: '[roleName reaction]...',
    run: async (originalMessage: Message, _args: string[], client: RoleBot) => {
		const [, ,...words] = originalMessage.content.split(/\s+/)
		const roles = words.filter((word, i) => word && i % 2 === 0)
		const reactions: any[] = words.filter((word, i) => word && i % 2 !== 0).map(reaction => {
			const match = /<:\w+:(\d+)>/.exec(reaction)
			if(match) {
				const [,id] = match
				return originalMessage.guild.emojis.get(id) as Emoji
			}
			return reaction
		})
		const reactionRoleMap: any = reactions.reduce((map, reaction, i) => ({
			...map,
			[reaction.id || reaction]: roles[i]
		}), {})
		console.log('reactionRoles', reactionRoleMap)
        const roleReactions = roles.map((role, i) => role + " => " + reactions[i]) 
        const sentMessage = await originalMessage.channel.sendMessage(roleReactions.join('\n')) as Message
		client.joinMessages.set(sentMessage.id, sentMessage)
		addJoinMessage(sentMessage.id, sentMessage.channel.id)
		// get MessageReaction from .react and send .emoji.id or .emoji.name to db?
		// get role id. Same role from db???
        const messageReactions = await Promise.all(reactions.map(reaction => sentMessage.react(reaction)))
		messageReactions.forEach(r => {
			const id = r.emoji.id || r.emoji.name
			const roleName = reactionRoleMap[id]
			const role = originalMessage.guild.roles.find(({name}) => name === roleName)
			addReactionRole(id, role.id, role.name)
		})
    }
}
