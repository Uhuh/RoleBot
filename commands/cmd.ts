import addRole from './addRole'
import addChannel from './addChannel';
import removeChannel from './removeChannel';

let commandsMap = new Map()
let list  = [addRole, addChannel, removeChannel]

for (const i of list) {
  for (const j of i.alias) {
    commandsMap.set(j, i)
  }
}

export default commandsMap