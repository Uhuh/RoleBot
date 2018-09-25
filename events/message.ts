import { Message, Channel } from 'discord.js'
import Bowsette from '../src/bot'
import roles from '../commands/roles'
import cmds from '../commands/cmd'

const primary_roles: Map<string, string> = new Map([['twist', '493536445710073893'], ['chocolate', '493536349064921099'], ['split', '493557274460028928'], ['vanilla', '493536643639410708'], ['neopolitan', '493536796349693967']])
const secondary_roles: Map<string, string> = new Map([['butterscotch', '493943715077947392'], ['tora', '493930168763547648']])

export default (client: Bowsette, message: Message) => {
  const channel: Channel | undefined = message.channel
  
  if (channel.id === client.config.ROLE_CHANNEL) {
    roles(client, message)
    return
  }
  if (message.guild && message.mentions.members.has(client.user.id))
  {
    const length: number = message.content.indexOf(client.config.PREFIX) === 0 ? client.config.PREFIX.length : (message.content.split(' ')[0].length)
    // + 1 for the damn space.
    const [command, ...args] = message.content.substring(length + 1).split(' ')
    //If the command isn't in the big ol' list.
    if (!cmds.has(command.toLowerCase())) return "Command DNE"
    // Find the command and run it.
    cmds.get(command.toLowerCase()).run(message, args, client)
  }
}