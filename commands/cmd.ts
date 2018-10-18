import addRole from './addRole'
import addChannel from './addChannel'
import removeChannel from './removeChannel'
import tag from './tag';
import status from './status';
import deleteRoles from './deleteRoles';

let commandsMap = new Map()
let list  = [addRole, addChannel, removeChannel, tag, status, deleteRoles]

for (const i of list) {
  for (const j of i.alias) {
    commandsMap.set(j, i)
  }
}

export default commandsMap