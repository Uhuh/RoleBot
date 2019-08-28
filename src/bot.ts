import * as Discord from "discord.js"
import * as dotenv from "dotenv"

dotenv.config()
import * as config from "./vars"
import msg from "../events/message"
import commandHandler from "../commands/commandHandler"
import joinRole from "../events/joinRoles"
import roleUpdate from "../events/roleUpdate"
import * as DBL from 'dblapi.js'
import removed from "../events/removed"
import * as logger from "log-to-file";
import {getRoleByReaction, getJoinMessages} from './setup_table'

interface Command {
  desc: string
  args: string
  name: string
  run: Function
}

export default class RoleBot extends Discord.Client {
  config: any
  commands: Discord.Collection<string, Command>
  joinMessages: Discord.Collection<string, Discord.Message>

  constructor() {
    super()
    this.config = config
    this.commands = new Discord.Collection()
	this.joinMessages = new Discord.Collection()

    commandHandler(this)
    this.on("ready", () => {
      const dblapi = new DBL(this.config.DBLTOKEN, this)
      console.log(`[Started]: ${new Date()}`)
      if (this.config.DEV_MODE === "0") setInterval(() => dblapi.postStats(this.guilds.size), 1800000)
      setInterval(() => this.presence(), 10000)
    })

    this.on("message", message => msg(this, message))
    this.on("guildMemberAdd", member => joinRole(member))
    this.on("roleUpdate", (_oldRole, newRole) => roleUpdate(newRole))
    this.on("guildCreate", guild => logger(`Joined - { guildId: ${guild.id}, guildName: ${guild.name}, ownerId: ${guild.ownerID}, numMembers: ${guild.memberCount}}`, 'guilds.log'))
    this.on("guildDelete", guild => removed(guild))
	this.on("messageReactionAdd", async (reaction, user) => {
		const message = reaction.message
		if(this.joinMessages.has(message.id)) {
			const id = reaction.emoji.id || reaction.emoji.name
			const [{role_id}] = await getRoleByReaction(id)
			const role = message.guild.roles.get(role_id)!
			const member = message.guild.members.get(user.id)!
			member.addRole(role)
		}
	})
	this.on("messageReactionRemove", async (reaction, user) => {
		const message = reaction.message
		if(this.joinMessages.has(message.id)) {
			const id = reaction.emoji.id || reaction.emoji.name
			const [{role_id}] = await getRoleByReaction(id)
			const role = message.guild.roles.get(role_id)!
			const member = message.guild.members.get(user.id)!
			member.removeRole(role)
		}
	})
  }

  presence() {
    const presArr = [
      `@${this.user.username} help`,
      `in ${this.guilds.size} guilds`,
      `with ${Math.floor(this.ping)} ping`
    ]

    this.user.setPresence({
      game: {name: presArr[Math.floor(Math.random() * presArr.length)]},
      status: "online"
    })
  }

  async loadJoinMessages() {
	const rows = await getJoinMessages()
	const messages = await Promise.all(rows.map(({message_id, channel_id}) => (this.channels.get(channel_id)! as Discord.TextChannel).fetchMessage(message_id)))
	messages.forEach(m => this.joinMessages.set(m.id, m))
  }

  async start() {
    await this.login(this.config.TOKEN)
	await this.loadJoinMessages()
  }
}
