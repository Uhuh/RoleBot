import BowsetteBot from "./bot";

const RoleBot = new BowsetteBot();

RoleBot.start().catch(e => {
  console.log(e);
});
