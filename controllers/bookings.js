const express = require("express");
const bookings = express.Router();
const input_filter = require('../_input_filter_');
const variable = require('../_variable_');
const { book_an_room, get_all_future_bookings_on_all_rooms, get_booking_by_ids, mark_booking_delete } = require('../queries/bookings');
//////////////////////////////////////////////
bookings.get('/', async (req, res) => {
  //list all future booking
  req.general_procedure(req, res, async () => {
    const ret = await get_all_future_bookings_on_all_rooms();
    console.log(ret);
    if (ret.error) {
      res.json({ error: error.message });
    } else {
      res.json({ payload: ret });
    }
  })

})

bookings.get("/:id", async (req, res) => {
  //retrieve a booking by id
  const { id } = req.params;
  await req.general_procedure(req, res, async () => {
    //validation
    const validation = input_filter.positive_int_only_tester(id);
    if (validation.ret === false) throw new Error(400);
    const { bookings, rooms, error } = await get_booking_by_ids([id]);
    if (error !== undefined) throw new Error(error.message);
    //re Organized data
    const ret = { ...bookings[0], roomInfo: rooms[0] };
    res.json({ payload: ret });
  })
})

bookings.post('/', async (req, res) => {
  //book an room
  const { meetingName, startDate, endDate, attendees, meetingRoomId } = req.body;
  await req.general_procedure(req, res, async () => {
    //input validation
    const booking_info = {
      meetingName: input_filter.english_letter_space_number_only_tester(meetingName),
      startDate: input_filter.start_date_tester(startDate, variable.booking_datetime_constraint),
      endDate: input_filter.end_date_tester(startDate, endDate, variable.booking_datetime_constraint),
      attendees: input_filter.email_list_only_tester(attendees),
      meetingRoomId: input_filter.positive_int_only_tester
    }

    for (let key in booking_info) if (booking_info[key].ret === false) {
      res.json({
        error: "input not vaild.",
        detail: booking_info
      });
      //it ends here, if some value not vaild
      return;
    }
    const { sub, email } = req.oidc.user;
    const ret = await book_an_room({
      meeting_name: meetingName,
      start_date: startDate,
      end_date: endDate,
      attendees,
      host: sub,
      host_email: email,
      meeting_room_id: meetingRoomId
    });
    //insert into db
    if (ret.error !== undefined) {
      //error occurred 
      res.json({ error: ret.error });
    } else if (ret.is_overlap !== undefined) {
      //had overlap
      res.json({ error: "booking overlaped", is_overlap: ret.is_overlap });
    } else {
      res.json({ payload: ret });
    }
  })
})

bookings.delete("/:id", async (req, res) => {
  //cancel a booking by id
  req.general_procedure(req, res, async () => {
    const { id: booking_id } = req.params;
    //validation
    const validation = input_filter.positive_int_only_tester(booking_id);
    if (validation.ret === false) throw new Error(validation.explain);
    //mark delete to db
    const ret = await mark_booking_delete(booking_id, req.oidc.user);
    if (ret.error) throw new Error(res.error);
    res.json({ payload: ret.id });
  })

})
//////////////////////////////////////////////
module.exports = bookings;