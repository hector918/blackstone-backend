const { db, table_name } = require("../db/db-config");
const { log_error, performance_timer } = require('../_log_.js');
const input_filter = require('../_input_filter_');
const { bookings_table_name, user_table_name } = table_name;
const { get_meeting_rooms_by_ids_t } = require('./meeting-room');
/////field template///////////////////////////////////
const booking_template_to_save = () => {
  return {
    "meeting_name": input_filter.english_letter_space_number_only_filter,
    "start_date": input_filter.start_date_filter,
    "end_date": input_filter.end_date_filter,
    "attendees": input_filter.email_list_only_filter,
    "host": input_filter.auth0_sub_filter,
    "host_email": input_filter.email_only_filter,
    "meeting_room_id": input_filter.positive_int_only_filter,
    "timestamp": input_filter.string_filter
  }
}
const booking_template_to_show = () => {
  return ["meeting_name", "start_date", "end_date", "attendees", "id", "host_email", "meeting_room_id", "timestamp"];
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
async function query_for_overlap_booking_t(booking, t) {
  return await t.manyOrNone(`SELECT ${booking_template_to_show().join(",")} FROM ${bookings_table_name} WHERE meeting_room_id = $[meeting_room_id] AND (start_date, end_date) OVERLAPS ($[start_date], $[end_date]) AND status = 0;`, booking);
}
async function get_future_bookings_with_room_id_t(meeting_room_id = undefined, t) {
  const where = meeting_room_id !== undefined ? `meeting_room_id = $[meeting_room_id] AND` : "";
  //if use CURRENT_TIMESTAMP will count datetime, if use CURRENT_DATE will count for today, including the passed of today
  return await t.manyOrNone(`SELECT ${booking_template_to_show().join(",")} FROM ${bookings_table_name} WHERE ${where} start_date > CURRENT_TIMESTAMP AND end_date > CURRENT_TIMESTAMP AND status = 0 ORDER BY start_date;`, { meeting_room_id });
}
const check_if_admin_or_owner_need_email = ` AND (host_email = $[email] OR (SELECT MIN(power) FROM ${user_table_name} WHERE email = $[email]) = 0) `;
/////export///////////////////////////////////
const book_an_room = async (form) => {
  form.timestamp = new Date().toLocaleString();
  return await genenal_query_procedure(async (connection, pt) => {
    // sanitize user input
    const booking_template = booking_template_to_save();
    const clean_booking = {};
    for (let key in booking_template) clean_booking[key] = input_filter.filter_val(form[key], booking_template[key]);
    clean_booking['attendees'] = { email_list: clean_booking['attendees'] };
    pt.add_tick("create an transition");
    return await connection.tx(async t => {
      pt.add_tick("check booking overlap");
      const is_overlap = await query_for_overlap_booking_t(clean_booking, t);
      //check for booking overlap
      if (is_overlap.length > 0) return { is_overlap };
      pt.add_tick("insert into table");
      //insert into table
      const added = await t.oneOrNone(`INSERT INTO 
      ${bookings_table_name} 
      (${Object.keys(booking_template).join(",")})
      VALUES ($[${Object.keys(booking_template).join("],$[")}]) 
      RETURNING ${booking_template_to_show().join(",")}`, clean_booking);
      if (added.id) {
        //return all future booking about this room, if runs normal the function ends here
        pt.add_tick("draw booking by id");

        const bookings = await get_future_bookings_with_room_id_t(clean_booking.meeting_room_id, t);
        return { added, bookings };
      }
      //if error, undo the transition
      throw new Error(`unknown error happen in booking an room. call admin.<br>form example<br>${JSON.stringify(form)}`)
    })
  })
}

const get_future_bookings_by_meeting_room_id = async (meeting_room_id) => {
  return await genenal_query_procedure(async (connection, pt) => {
    pt.add_tick("get bookings");
    return await get_future_bookings_with_room_id_t(meeting_room_id, connection);
  })
}

const get_all_future_bookings_on_all_rooms = async () => {
  return await genenal_query_procedure(async (connection, pt) => {
    return await connection.tx(async t => {
      pt.add_tick("getting future bookings");
      const bookings = await get_future_bookings_with_room_id_t(undefined, connection);
      const room_list = bookings.map(el => `'${el.meeting_room_id}'`);
      let rooms = undefined
      if (room_list.length > 0) {
        pt.add_tick("getting future bookings room info");
        rooms = await get_meeting_rooms_by_ids_t(room_list, t);
      }

      return { bookings, rooms };
    })
  })
}

const get_booking_by_ids = async (ids) => {
  return await genenal_query_procedure(async (connection, pt) => {
    return await connection.tx(async t => {
      const clean_ids = ids.map(n => input_filter.filter_val(n, input_filter.positive_int_only_filter));
      pt.add_tick("geting booking by ids");
      const bookings = await t.manyOrNone(`SELECT ${booking_template_to_show().join(",")} FROM ${bookings_table_name} WHERE id in (${clean_ids.join(',')}) AND status = 0;`);
      const room_list = bookings.map(el => `'${el.meeting_room_id}'`);
      pt.add_tick('collecting room info with booking room id');
      const rooms = await get_meeting_rooms_by_ids_t(room_list, t);
      return { bookings, rooms };
    })

  })
}
async function mark_booking_delete(booking_id, user) {
  return await genenal_query_procedure(async (connection, pt) => {
    const clean_booking_id = input_filter.filter_val(booking_id, input_filter.positive_int_only_filter);

    const sql = `UPDATE ${bookings_table_name} SET status = 2 WHERE id = $[booking_id] ${check_if_admin_or_owner_need_email} RETURNING ${booking_template_to_show().join(',')};`;

    return await connection.oneOrNone(sql, { "booking_id": clean_booking_id, "email": user.email });
  })
}
async function update_booking_by_id(booking_id, form, user) {
  const booking_template = booking_template_to_save();
  return await genenal_query_procedure(async (connection, pt) => {
    //clean up input
    delete form["id"];
    const clean_booking_id = input_filter.filter_val(booking_id, input_filter.positive_int_only_filter);
    const clean_form = {};
    const update_set = [];
    for (let key in booking_template) if (form[key] !== undefined) {
      if (key !== "attendees") continue;
      if (key === "attendees") {
        clean_form[key] = { email_list: input_filter.filter_val(form[key], booking_template[key]) }
      } else {
        clean_form[key] = input_filter.filter_val(form[key], booking_template[key]);
      }
      update_set.push(`${key} = $[${key}]`);
    }
    //create sql and update
    const sql = `UPDATE ${bookings_table_name} SET ${update_set.join(",")} WHERE id=$[booking_id] ${check_if_admin_or_owner_need_email} RETURNING ${booking_template_to_show().join(',')};`;
    return await connection.oneOrNone(sql,
      { ...clean_form, booking_id: clean_booking_id, email: user.email }
    );
  })
}
/////////////////////////////
module.exports = { book_an_room, get_future_bookings_by_meeting_room_id, get_all_future_bookings_on_all_rooms, get_booking_by_ids, mark_booking_delete, update_booking_by_id }