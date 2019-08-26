import { Message } from "discord.js";

export default {
    desc: 'Create a message with reactions that toggle roole assignment',
    name: 'joinMessage',
    args: '<message> [roleName reaction]...',
    run: async (originalMessage: Message, _args: string[]) => {
        const [message, ...rest] = _args;
        const roleReactions = rest.join(' ').split(/\w+\W\w+/)
        const reactions = roleReactions.map((roleReaction) => roleReaction.split(' ')).map(([,reaction]) => reaction)
        const sentMessage = await originalMessage.channel.sendMessage(message + '\n' + roleReactions.join('=>')) as Message
        reactions.forEach(reaction => sentMessage.react(reaction))
    }
}
