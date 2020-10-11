import RB from "./bot"
import * as logger from "log-to-file"

const RoleBot = new RB()

RoleBot.start().catch(e => {
  logger(`Error occurred during bot runtime: ${e}`, 'errors.log')
});

export default RoleBot;