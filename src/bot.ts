import * as Discord from 'discord.js'
import * as dotenv from 'dotenv'
dotenv.config()
import * as config from './vars'
import msg from '../events/message'
import setup_table from './setup_table'
import deleteRoles from '../commands/deleteRoles';

export default class Bowsette extends Discord.Client {
  config: any
  addRole: any
  getRoles: any
  addChannel: any
  removeChannel: any
  deleteRoles: any
  getChannel: any
  updateMessageCounter: any
  getMessageCount: any
  constructor() {
    super()
    this.config = config

    this.on('ready', () => {
      console.log(`[Started]: ${new Date()}`)
      setup_table(this)
    })
    this.on('message', (message: Discord.Message) => msg(this, message))
  }

  async start() {
    await this.login(this.config.TOKEN)
  }
}