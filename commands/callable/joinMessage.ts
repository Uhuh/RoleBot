import { Message, Emoji } from "discord.js";

export default {
    desc: 'Create a message with reactions that toggle roole assignment',
    name: 'joinMessage',
    args: '[roleName reaction]...',
    run: async (originalMessage: Message, _args: string[]) => {
		const [, ,...words] = originalMessage.content.split(/\s+/)
		const roles = words.filter((word, i) => word && i % 2 === 0)
		const reactions = words.filter((word, i) => word && i % 2 !== 0).map(reaction => {
			const match = /<:\w+:(\d+)>/.exec(reaction)
			if(match) {
				const [,id] = match
				return originalMessage.guild.emojis.get(id) as Emoji
			}
			return reaction
		})
        const roleReactions = roles.map((role, i) => role + " => " + reactions[i]) 
        const sentMessage = await originalMessage.channel.sendMessage(roleReactions.join('\n')) as Message
        reactions.forEach(reaction => sentMessage.react(reaction))
    }
}
