const express = require("express");
const bookings = express.Router();
const input_filter = require('../_input_filter_');
const variable = require('../_variable_');
const { book_an_room } = require('../queries/bookings');
//////////////////////////////////////////////
bookings.get('/', async (req, res) => {

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
    const { sid, email } = req.oidc.user;
    const ret = await book_an_room({
      meeting_name: meetingName,
      start_date: startDate,
      end_date: endDate,
      attendees,
      host: sid,
      host_email: email,
      meeting_room_id: meetingRoomId
    });
    //insert into db
    console.log(ret)
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
//////////////////////////////////////////////

module.exports = bookings;