import addRole from './addRole'

let commandsMap = new Map()
let list  = [addRole]

for (const i of list) {
  for (const j of i.alias) {
    commandsMap.set(j, i)
  }
}

export default commandsMap