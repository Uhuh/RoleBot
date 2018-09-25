import BowsetteBot from './bot'

const Bowsette = new BowsetteBot()

Bowsette.start().catch((e) => {
  console.log(e)
})