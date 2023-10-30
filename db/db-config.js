const pgp = require("pg-promise")();
require("dotenv").config();

var connectionOptions = {
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DB,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  poolSize: 10,
  poolIdleTimeout: 10000
};
try {
  var db = pgp(connectionOptions);

} catch (error) {
  console.error("database connection error", error);
}
const table_name = {
  meeting_room_table_name: '\"blackstone-meetingroom\"',
  user_table_name: '\"blackstone-user\"',
  bookings_table_name: '\"blackstone-bookings\"'
}

module.exports = { db, table_name };