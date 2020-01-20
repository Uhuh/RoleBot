import * as SQLite from "better-sqlite3"

const sql = new SQLite("./roles.sqlite")

const setupTable = () => {
  const table = sql
    .prepare(
      "SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = 'roles'"
    )
    .get()
  if (!table["count(*)"]) {
    // If the table isn't there, create it and setup the database correctly.
    sql
      .prepare(
        "CREATE TABLE roles (id TEXT PRIMARY KEY, role_name TEXT, prim_role INT, guild TEXT, role_id TEXT)"
      )
      .run()
    // Ensure that the 'id' row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_roles_id ON roles (id)").run()
    sql.pragma("synchronous = 1")
    sql.pragma("journal_mode = wal")
  }
  const roleChannelTable = sql
    .prepare(
      "SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = 'role_channel'"
    )
    .get()
  if (!roleChannelTable["count(*)"]) {
    // If the table isn't there, create it and setup the database correctly.
    sql
      .prepare(
        "CREATE TABLE role_channel (id TEXT PRIMARY KEY, channel_id TEXT, guild TEXT, message_id TEXT)"
      )
      .run()
    // Ensure that the 'id' row is always unique and indexed.
    sql
      .prepare("CREATE UNIQUE INDEX idx_channel_id ON role_channel (id)")
      .run()
    sql.pragma("synchronous = 1")
    sql.pragma("journal_mode = wal")
  }
  const joinRolesTable = sql
    .prepare(
      "SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = 'join_roles'"
    )
    .get()
  if (!joinRolesTable["count(*)"]) {
    // If the table isn't there, create it and setup the database correctly.
    sql
      .prepare(
        "CREATE TABLE join_roles (id TEXT PRIMARY KEY, role_name TEXT, role_id TEXT, guild_id TEXT)"
      )
      .run()
    // Ensure that the 'id' row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_role_id ON join_roles (id)").run()
    sql.pragma("synchronous = 1")
    sql.pragma("journal_mode = wal")
  }
  const reactMessageTable = sql
    .prepare(
      "SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = 'react_message'"
    )
    .get()
  if (!reactMessageTable["count(*)"]) {
    sql
      .prepare(
        "CREATE TABLE react_message (message_id TEXT PRIMARY KEY, channel_id TEXT, guild_id TEXT)"
      )
      .run()
  }
  const reactionRoleTable = sql
    .prepare(
      "SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = 'reaction_role'"
    )
    .get()
  if (!reactionRoleTable["count(*)"]) {
    sql
      .prepare("CREATE TABLE reaction_role (guild_id TEXT, emoji_id TEXT, role_id TEXT, role_name TEXT, PRIMARY KEY (emoji_id, role_id))")
      .run()
  }
  const reactionFolderTable = sql
    .prepare(
      "SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = 'folder'"
    ).get()
  if (!reactionFolderTable["count(*)"]) {
    sql
      .prepare("CREATE TABLE folder (id INTEGER PRIMARY KEY, guild_id TEXT, label TEXT)")
      .run()
  }

  // Don't forget to comment this out once ran :)))
  // sql.prepare("ALTER TABLE reaction_role ADD folder_id TEXT").run()
}

setupTable()

// Folders
export const addFolder = (guild_id: string, label: string) => sql.prepare(
  "INSERT OR REPLACE INTO folder (guild_id, label) VALUES (@guild_id, @label)"
).run({ guild_id, label });
export const guildFolders = (guild_id: string) => sql.prepare(
  "SELECT folder.id, folder.label FROM folder WHERE guild_id = @guild_id"
).all({ guild_id });
export const folderId = (guild_id: string, label: string): { id: number }[] => sql.prepare(
  "SELECT id FROM folder WHERE guild_id = @guild_id AND label = @label"
).all({ guild_id, label })
export const folderContent = (id: number | null) => sql.prepare(
  `
   SELECT folder.id, folder.guild_id, folder.label, reaction_role.emoji_id, reaction_role.role_id, reaction_role.role_name
   FROM folder LEFT JOIN reaction_role ON folder.id=reaction_role.folder_id WHERE folder.id = @id
  `
).all({ id })
export const deleteFolder = (id: number) => {
  sql.prepare(`DELETE FROM folder WHERE folder.id = @id`).run({ id })
  sql.prepare(`UPDATE reaction_role SET folder_id = null WHERE reaction_role.folder_id = @id`).run({ id })
}

// Join roles
export const joinRoles = sql.prepare(
  "INSERT OR REPLACE INTO join_roles (id, role_name, role_id, guild_id) VALUES (@id, @role_name, @role_id, @guild_id)"
)
export const getJoinRoles = (guild_id: string) => sql.prepare(
  "SELECT * FROM join_roles WHERE guild_id = @guild_id"
).all({ guild_id })
export const deleteJoin = sql.prepare(
  "DELETE FROM join_roles WHERE guild_id = ? AND role_name = ?"
)

// Roles
export const deleteRole = sql.prepare(
  "DELETE FROM roles WHERE guild = ? AND role_name = ?"
)
export const getRoles = (guild: string) => sql.prepare(
  "SELECT * FROM roles WHERE guild = @guild"
).all({ guild })
export const addRole = sql.prepare(
  "INSERT OR REPLACE INTO roles (id, role_name, prim_role, guild, role_id) VALUES (@id, @role_name, @prim_role, @guild, @role_id)"
)

// Role channels
export const getChannel = (guild_id: string) => sql.prepare(
  "SELECT * FROM role_channel WHERE guild = @guild_id"
).all({ guild_id })
export const removeChannel = sql.prepare(
  "DELETE FROM role_channel WHERE guild = ?"
)
export const addChannel = sql.prepare(
  "INSERT OR REPLACE INTO role_channel (id, channel_id, guild, message_id) VALUES (@id, @channel_id, @guild, @message_id)"
)

// Removed from guild
export const removeJoinRoles = (guild_id: string) => sql.prepare(
  "DELETE FROM join_roles WHERE guild_id = @guild_id"
).run({ guild_id })
export const removeRoles = (guild_id: string) => sql.prepare(
  "DELETE FROM roles WHERE guild = @guild_id"
).run({ guild_id })
export const removeRoleChannel = (guild_id: string) => sql.prepare(
  "DELETE FROM role_channel WHERE guild = @guild_id"
).run({ guild_id })
export const removeReactRoles = (guild_id: string) => sql.prepare(
  "DELETE FROM reaction_role WHERE guild_id = @guild_id"
).run({ guild_id })
export const removeReactMsg = (guild_id: string) => sql.prepare(
  "DELETE FROM react_message WHERE guild_id = @guild_id"
).run({ guild_id })

// The message that contains all the react roles to type
export const addReactMessage = (message_id: string, channel_id: string, guild_id: string) => sql.prepare(
  "INSERT OR REPLACE INTO react_message (message_id, channel_id, guild_id) VALUES (@message_id, @channel_id, @guild_id)"
).run({ message_id, channel_id, guild_id })
export const getReactMessages = () => sql.prepare(
  "SELECT * FROM react_message"
).all();
export const removeReactMessage = (message_id: string) => sql.prepare(
  "DELETE FROM react_message WHERE message_id = @message_id"
).run({ message_id })

// Reaction Roles
export const guildReactions = (guild_id: string) => sql.prepare(
  "SELECT * FROM reaction_role WHERE guild_id = @guild_id"
).all({ guild_id })
export const getRoleByReaction = (emoji_id: string, guild_id: string) => sql.prepare(
  "SELECT * from reaction_role WHERE emoji_id = @emoji_id AND guild_id = @guild_id"
).all({ emoji_id, guild_id })
export const addReactionRole = (emoji_id: string, role_id: string, role_name: string, guild_id: string, folder_id?: number | null) => sql.prepare(
  "INSERT INTO reaction_role (emoji_id, role_id, role_name, guild_id, folder_id) VALUES (@emoji_id, @role_id, @role_name, @guild_id, @folder_id)"
).run({ emoji_id, role_id, role_name, guild_id, folder_id })
export const removeReactionRole = (role_id: string) => sql.prepare(
  "DELETE FROM reaction_role WHERE role_id = @role_id"
).run({ role_id })
export const rolesByFolderId = (guild_id: string, id: number | null) => sql.prepare(
  `SELECT * FROM reaction_role WHERE reaction_role.folder_id ${id ? "= @id" : "IS NULL"} AND reaction_role.guild_id = @guild_id`
).all({ guild_id, id })
