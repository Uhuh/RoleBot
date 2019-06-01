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
}

setupTable()

// Join roles
export const joinRoles = sql.prepare(
  "INSERT OR REPLACE INTO join_roles (id, role_name, role_id, guild_id) VALUES (@id, @role_name, @role_id, @guild_id)"
)
export const getJoinRoles = sql.prepare(
  "SELECT * FROM join_roles WHERE guild_id = ?"
)
export const deleteJoin = sql.prepare(
  "DELETE FROM join_roles WHERE guild_id = ? AND role_name = ?"
)

// Roles
export const deleteRole = sql.prepare(
  "DELETE FROM roles WHERE guild = ? AND role_name = ?"
)
export const getRoles = sql.prepare("SELECT * FROM roles WHERE guild = ?")
export const addRole = sql.prepare(
  "INSERT OR REPLACE INTO roles (id, role_name, prim_role, guild, role_id) VALUES (@id, @role_name, @prim_role, @guild, @role_id)"
)

// Role channels
export const getChannel = sql.prepare(
  "SELECT * FROM role_channel WHERE guild = ?"
)
export const removeChannel = sql.prepare(
  "DELETE FROM role_channel WHERE guild = ?"
)
export const addChannel = sql.prepare(
  "INSERT OR REPLACE INTO role_channel (id, channel_id, guild, message_id) VALUES (@id, @channel_id, @guild, @message_id)"
)


// Removed from guild
export const removeJoinRoles = sql.prepare(
  "DELETE FROM join_roles WHERE guild_id = ?"
)
export const removeRoles = sql.prepare(
  "DELETE FROM roles WHERE guild = ?"
)
export const removeRoleChannel = sql.prepare(
  "DELETE FROM role_channel WHERE guild = ?"
)