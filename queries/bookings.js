const db = require("../db/db-config");
const { log_error, performance_timer } = require('../_log_.js');
const input_filter = require('../_input_filter_');
const bookings_table_name = '\"blackstone-bookings\"';
/////field template///////////////////////////////////
const booking_template_to_save = () => {
  return {
    "meeting_name": input_filter.english_letter_space_number_only_filter,
    "start_date": input_filter.start_date_filter,
    "end_date": input_filter.end_date_filter,
    "attendees": input_filter.email_list_only_filter,
    "host": input_filter.english_letter_space_number_only_filter,
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
  const pt = new performance_timer(`event - ${task.name}`);
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
async function get_future_bookings_with_room_id_t(meeting_room_id, t) {
  return await t.manyOrNone(`SELECT ${booking_template_to_show().join(",")} FROM ${bookings_table_name} WHERE meeting_room_id = $[meeting_room_id] AND start_date > CURRENT_DATE AND end_date > CURRENT_DATE AND status = 0 ORDER BY start_date;`, { meeting_room_id });
}
async function mark_booking_delete(booking_id, t) {
  return await t.oneOrNone(`UPDATE `);
}
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
      const ret = await t.oneOrNone(`INSERT INTO 
      ${bookings_table_name} 
      (${Object.keys(booking_template).join(",")})
      VALUES ($[${Object.keys(booking_template).join("],$[")}]) 
      RETURNING ${booking_template_to_show().join(",")}`, clean_booking);
      if (ret.id) {
        //return all future booking about this room, if runs normal the function ends here
        pt.add_tick("draw booking by id");

        return await get_future_bookings_with_room_id_t(clean_booking.meeting_room_id, t);
      }
      //if error, undo the transition
      throw new Error(`unknown error happen in booking an room. call admin.<br>form example<br>${JSON.stringify(form)}`)
    })
  })
}

const get_future_bookings_by_meeting_room_id = async (meeting_room_id) => {
  return await genenal_query_procedure(async (connection, pt) => {
    const ret = await get_future_bookings_with_room_id_t(meeting_room_id, connection);
    console.log(ret);
    return ret;
  })
}
/////////////////////////////
module.exports = { book_an_room, get_future_bookings_by_meeting_room_id, bookings_table_name }