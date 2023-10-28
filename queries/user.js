const db = require("../db/db-config");
const { log_db_error, performance_timer } = require('../_log_.js');
const input_filter = require('../_input_filter_');
/////field template///////////////////////////////////
const user_template_to_save = () => {
  return {
    "name": input_filter.english_name_only_filter,
    "email": input_filter.email_only_filter,
    "last_seen": input_filter.string_filter,
    "sid": input_filter.string_filter
  }
}
const user_template_to_show = () => {
  return ["name", "email", "sid"];
}
/////helper///////////////////////////////////////////
async function genenal_query_procedure(task) {
  const pt = new performance_timer(`event - ${task.toString()}`);
  //draw an connection from the pool
  const connection = await db.connect();
  try {
    pt.add_tick("start task");
    const ret = await task(connection, pt);
    pt.add_tick("end task");
    return ret;
  } catch (error) {
    log_db_error(error);
    return error.message;
  } finally {
    pt.done();
    if (connection) connection.done();
  }
}
const filter_val = (val, filter) => {
  if (filter) return filter(val);
  return null;
}
///export/////////////////////////////////
const register_user_status = async (profile) => {
  profile['last_seen'] = new Date().toLocaleString();

  const ret = await genenal_query_procedure(async (connection) => {
    //sanitize input
    const user_template = user_template_to_save();
    const clean_profile = {};
    for (let key in user_template) if (profile[key] !== undefined) {
      clean_profile[key] = filter_val(profile[key], user_template[key]);
    }

    //insert or update
    const user = await connection.oneOrNone(`INSERT INTO \"blackstone-user\" (name, email, sid, last_seen)
    VALUES ($[name], $[email], $[sid], $[last_seen])
    ON CONFLICT (sid) DO UPDATE SET
    last_seen = $[last_seen] RETURNING ${user_template_to_show().join(",")};`, clean_profile);
    return user;
  })
  return ret;
}
///////////////////////////////////////////
module.exports = { register_user_status }