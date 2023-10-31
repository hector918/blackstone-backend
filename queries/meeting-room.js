const { db, table_name } = require("../db/db-config");
const { log_error, performance_timer } = require('../_log_.js');
const input_filter = require('../_input_filter_');
const { meeting_room_table_name, bookings_table_name } = table_name;
/////field template///////////////////////////////////
const meeting_room_template_to_save = () => {
  return {
    "name": input_filter.english_letter_space_number_only_filter,
    "capacity": input_filter.positive_int_only_filter,
    "floor": input_filter.int_only_filter,
    "manager": input_filter.auth0_sub_filter,
    "manager_email": input_filter.email_only_filter
  }
}
const meeting_room_template_to_show = () => {
  return ["id", "name", "capacity", "floor", "manager", "manager_email", "available"];
}
const search_form_template = () => {
  return {
    "start_date": input_filter.start_date_filter,
    "end_date": input_filter.start_date_filter,
    "capacity": input_filter.positive_int_only_filter,
    "capacityOp": input_filter.operater_filter,
    "floor": input_filter.int_only_filter,
    "floorOp": input_filter.operater_filter
  }
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

const get_all_meeting_rooms = async () => {
  return await genenal_query_procedure(async (connection) => {
    return await connection.many(`SELECT ${meeting_room_template_to_show().join(",")} FROM ${meeting_room_table_name};`);
  })
}

const get_meeting_rooms_by_ids_t = async (ids, t) => {
  return await t.manyOrNone(`SELECT ${meeting_room_template_to_show().join(",")} FROM ${meeting_room_table_name} WHERE id in (${ids.join(",")});`)
}

const get_room_detail_by_id = async (id) => {
  return await genenal_query_procedure(async (connection, pt) => {
    //build up transition
    return await connection.tx(async t => {
      const room = await t.oneOrNone(`SELECT ${meeting_room_template_to_show().join(",")} FROM ${meeting_room_table_name} WHERE id=$[id];`, { id });
      pt.add_tick(`query room by ${id}`);
      if (room !== null) {
        return { room };
      } else return { error: "room not found." }
    });
  })
}

const search_available_room = async (form) => {
  return await genenal_query_procedure(async (connection, pt) => {
    // sanitize user input
    const search_template = search_form_template();
    const clean_form = {};
    for (let key in search_template) if (form[key] !== undefined) {
      clean_form[key] = input_filter.filter_val(form[key], search_template[key]);
    }
    //build up search key word
    const key_word = {
      dateSearch: "",
      bkey: "",
      capacity: "",
      floor: "",
      groupId: ""
    };
    if (clean_form["start_date"] && clean_form["end_date"]) {
      key_word["dateSearch"] = `LEFT JOIN ${bookings_table_name} 
      ON ${meeting_room_table_name}.id = ${bookings_table_name}.meeting_room_id AND 
      (${bookings_table_name}.start_date, ${bookings_table_name}.end_date) 
      OVERLAPS ($[start_date], $[end_date])`;
      key_word['bkey'] = `AND ${bookings_table_name}.id IS NULL `;
      key_word['groupId'] = `, ${bookings_table_name}.id`;

    }
    if (clean_form["capacity"] && clean_form["capacityOp"]) {
      key_word["capacity"] = `AND ${meeting_room_table_name}.capacity ${clean_form['capacityOp']} $[capacity]`;
    }
    if (clean_form["floor"] && clean_form["floorOp"]) {
      key_word["floor"] = `AND ${meeting_room_table_name}.floor ${clean_form['floorOp']} $[floor]`;
    }
    pt.add_tick("start search");
    //search
    return await connection.manyOrNone(`SELECT ${meeting_room_template_to_show().map(el => meeting_room_table_name + "." + el).join(",")} FROM ${meeting_room_table_name} ${key_word["dateSearch"]} WHERE ${meeting_room_table_name}.available = 0 ${key_word['capacity']} ${key_word['floor']} ${key_word['bkey']} GROUP BY ${meeting_room_table_name}.id ${key_word['groupId']};`, clean_form);
  })
}
/////////////////////////////
module.exports = { create_new_meeting_room, get_all_meeting_rooms, get_room_detail_by_id, search_available_room, get_meeting_rooms_by_ids_t }