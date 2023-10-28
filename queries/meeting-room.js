const db = require("../db/db-config");
const { log_error, performance_timer } = require('../_log_.js');
const input_filter = require('../_input_filter_');
const meeting_room_table_name = '\"blackstone-meetingroom\"';
/////field template///////////////////////////////////
const meeting_room_template_to_save = () => {
  return {
    "name": input_filter.english_letter_space_number_only_filter,
    "capacity": input_filter.positive_number_only_filter,
    "floor": input_filter.number_only_filter,
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
    const ret = task(connection, pt);
    pt.add_tick("end task");
    return ret;
  } catch (error) {
    log_error(error);
    return false;
  } finally {
    pt.done();
    if (connection) connection.done();
  }
}
/////export///////////////////////////////////
const create_new_meeting_room = async (room_info) => {
  // sanitize user input
  console.log(room_info);
  return false;
  const ret = await genenal_query_procedure(async connection => {
    return await connection.tx(async t => {

      const detail_ret = await t.manyOrNone(`SELECT ${Object.keys(happen_detail_template_to_show_()).join(",")} FROM happen_detail WHERE id in ('${id_array.join("','")}')`);

      if (detail_ret === false) return false;
      const images_ret = await t.manyOrNone(`SELECT ${Object.keys(detail_image_template_to_show_()).join(",")} FROM happen_detail_images WHERE happen_detail_id in ('${id_array.join("','")}')`);

      return { detail_ret, images_ret };
    })
  })
  return ret;
}

/////////////////////////////
module.exports = { create_new_meeting_room }