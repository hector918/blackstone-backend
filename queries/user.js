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
    "sid": input_filter.auth0_sid_filter,
    "sub": input_filter.auth0_sub_filter,
  }
}
const user_template_to_show = () => {
  return ["name", "email", "sid", "power", "sub"];
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
    Object.keys(user_template).join(",");
    Object.keys(user_template).join("],$[")

    const sql = `INSERT INTO ${user_table_name} (${Object.keys(user_template).join(",")})
      VALUES ($[${Object.keys(user_template).join("],$[")}])
      ON CONFLICT (sub) DO UPDATE SET
      last_seen = $[last_seen] RETURNING ${user_template_to_show().join(",")};`

    //insert or update
    const user = await connection.oneOrNone(sql, clean_profile);
    return user;
  })
  return ret;
}

const set_first_user_as_admin = async (id = 1) => {
  return await genenal_query_procedure(async connection => {
    return await connection.oneOrNone(`UPDATE ${user_table_name} SET power = 0 WHERE id = $[id]`, { id });
  })
}

const get_user_info_by_sub = async (sub) => {
  return await genenal_query_procedure(async connection => {
    return await connection.oneOrNone(`SELECT ${user_template_to_show().join(",")} FROM ${user_table_name} WHERE sub = $[sub] AND available = 0`, { sub });
  })
}

const get_user_info_by_email = async (email) => {
  const clean_email = input_filter.filter_val(email, input_filter.email_list_only_filter);
  return await genenal_query_procedure(async connection => {
    if (clean_email === "") throw new Error(`illegal email ${email}`);
    return await connection.oneOrNone(`SELECT ${user_template_to_show().join(",")} FROM ${user_table_name} WHERE email = $[email] AND available = 0`, { email: clean_email });
  })
}
///////////////////////////////////////////
module.exports = { register_user_status, set_first_user_as_admin, get_user_info_by_sub, get_user_info_by_email }