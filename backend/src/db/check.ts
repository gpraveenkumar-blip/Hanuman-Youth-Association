import { query } from "./client.js";

const result = await query(`
  SELECT
    current_database() AS database,
    current_user AS user,
    inet_server_addr()::text AS server,
    inet_server_port() AS port
`);

console.log(result.rows[0]);
process.exit(0);