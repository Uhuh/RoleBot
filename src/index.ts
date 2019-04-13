import RB from "./bot"

const RoleBot = new RB()

RoleBot.start().catch(e => {
  console.log(e)
})
