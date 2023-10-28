const db = require("../db/db-config");
const { log_error, performance_timer } = require('../_log_.js');
const input_filter = require('../_input_filter_');
const meeting_room_table_name = '\"blackstone-meetingroom\"';
/////field template///////////////////////////////////
const meeting_room_template_to_save = () => {
  return {
    "name": input_filter.english_letter_space_number_only_filter,
    "capacity": input_filter.positive_int_only_filter,
    "floor": input_filter.int_only_filter,
    "manager": input_filter.string_filter,
    "manager_email": input_filter.email_only_filter
  }
}
const meeting_room_template_to_show = () => {
  return ["name", "capacity", "floor", "manager", "manager_email", "available"];
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
    log_error(error);
    return { error };
  } finally {
    pt.done();
    if (connection) connection.done();
  }
}
async function check_for_duplicate_room(connection, room_info) {
  return await connection.oneOrNone(`SELECT id FROM ${meeting_room_table_name} WHERE floor = $[floor] and name = trim($[name])`, room_info);
}
/////export///////////////////////////////////
const create_new_meeting_room = async (room_info) => {
  return await genenal_query_procedure(async (connection, pt) => {
    // sanitize user input
    const room_template = meeting_room_template_to_save();
    const clean_room_info = {};
    for (let key in room_template) clean_room_info[key] = input_filter.filter_val(room_info[key], room_template[key]);
    //build up transition
    return await connection.tx(async t => {

      pt.add_tick("checking duplicate room");
      const is_duplicate = await check_for_duplicate_room(t, clean_room_info);
      if (is_duplicate !== null) throw new Error('duplicate room name at same floor.');

      pt.add_tick("inserting roominfo into table");
      return await t.oneOrNone(`INSERT INTO ${meeting_room_table_name} 
      (${Object.keys(room_template).join(",")}) 
      VALUES ($[${Object.keys(room_template).join("],$[")}]) 
      RETURNING ${meeting_room_template_to_show().join(",")}`, clean_room_info);
    })
  })
}



/////////////////////////////
module.exports = { create_new_meeting_room }