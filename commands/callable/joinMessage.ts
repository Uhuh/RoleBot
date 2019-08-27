import { Message, Emoji } from "discord.js";
import {addReactionRole} from '../../src/setup_table'

export default {
    desc: 'Create a message with reactions that toggle roole assignment',
    name: 'joinMessage',
    args: '[roleName reaction]...',
    run: async (originalMessage: Message, _args: string[]) => {
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
		const roleReactionMap: any = roles.reduce((map, role, i) => ({
			...map,
			[role]: reactions[i].id || reactions[i]
		}), {})
        const roleReactions = roles.map((role, i) => role + " => " + reactions[i]) 
        const sentMessage = await originalMessage.channel.sendMessage(roleReactions.join('\n')) as Message
		// get MessageReaction from .react and send .emoji.id or .emoji.name to db?
		// get role id. Same role from db???
        const messageReactions = await Promise.all(reactions.map(reaction => sentMessage.react(reaction)))
		messageReactions.forEach(r => {
			console.log(r && r.emoji)
			const id = r.emoji.id || r.emoji.name
			const roleName = roleReactionMap[id]
			const role = originalMessage.guild.roles.find(({name}) => name === roleName)
			//addReactionRole.run({emoji_id: id, role_id: role.id})
		})
    }
}
