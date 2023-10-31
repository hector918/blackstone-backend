const { db, table_name } = require("../db/db-config");
const { log_db_error, performance_timer } = require('../_log_.js');
const input_filter = require('../_input_filter_');
const { user_table_name } = table_name;
/////field template///////////////////////////////////
const user_template_to_save = () => {
  return {
    "name": input_filter.english_name_only_filter,
    "email": input_filter.email_only_filter,
    "last_seen": input_filter.string_filter,
    "sid": input_filter.auth0_sid_filter
  }
}
const user_template_to_show = () => {
  return ["name", "email", "sid", "power"];
}
/////helper///////////////////////////////////////////
async function genenal_query_procedure(task) {
  const pt = new performance_timer(`event - ${task}`);
  //draw an connection from the pool
  const connection = await db.connect();
  try {
    pt.add_tick("start task");
    const ret = await task(connection, pt);
    pt.add_tick("end task");
    return ret;
  } catch (error) {
    log_db_error(error);
    return { error };
  } finally {
    pt.done();
    if (connection) connection.done();
  }
}

///export/////////////////////////////////
const register_user_status = async (profile) => {
  profile['last_seen'] = new Date().toLocaleString();
  const ret = await genenal_query_procedure(async (connection) => {
    //sanitize input
    const user_template = user_template_to_save();
    const clean_profile = {};
    for (let key in user_template) {
      clean_profile[key] = input_filter.filter_val(profile[key], user_template[key]);
    }

    //insert or update
    const user = await connection.oneOrNone(`INSERT INTO ${user_table_name} (name, email, sid, last_seen)
    VALUES ($[name], $[email], $[sid], $[last_seen])
    ON CONFLICT (sid) DO UPDATE SET
    last_seen = $[last_seen] RETURNING ${user_template_to_show().join(",")};`, clean_profile);
    return user;
  })
  return ret;
}

const set_first_user_as_admin = async (id = 1) => {
  return await genenal_query_procedure(async connection => {
    return await connection.oneOrNone(`UPDATE ${user_table_name} SET power = 0 WHERE id = $[id]`, { id });
  })
}

const get_user_info_by_sid = async (sid) => {
  return await genenal_query_procedure(async connection => {
    return await connection.oneOrNone(`SELECT ${user_template_to_show().join(",")} FROM ${user_table_name} WHERE sid = $[sid] AND available = 0`, { sid });
  })
}
///////////////////////////////////////////
module.exports = { register_user_status, set_first_user_as_admin, get_user_info_by_sid }