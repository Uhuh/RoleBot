import { Message } from "discord.js";
import RoleBot from "../../src/bot";

export default {
    desc: 'Create a message with reactions that toggle roole assignment',
    name: 'joinMessage',
    args: '<message> [roleName reaction]...',
    run: async (originalMessage: Message, _args: string[], client: RoleBot) => {
        const [message, ...rest] = _args;
        const roleReaction = rest.join(' ').split(/\w+\W\w+/)
        originalMessage.channel.sendMessage(message + roleReaction.join('=>'))
    }
}