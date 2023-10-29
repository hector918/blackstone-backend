const express = require("express");
const bookings = express.Router();
const input_filter = require('../_input_filter_');
const variable = require('../_variable_');
//////////////////////////////////////////////
bookings.get('/', async (req, res) => {

})

bookings.post('/', async (req, res) => {
  //book and room
  const { meetingName, startDate, endDate, attendees } = req.body;
  await req.general_procedure(req, res, async () => {
    //input validation
    const booking_info = {
      meetingName: input_filter.english_letter_space_number_only_tester(meetingName),
      startDate: input_filter.start_date_tester(startDate, variable.booking_datetime_constraint),
      endDate: input_filter.end_date_tester(startDate, endDate, variable.booking_datetime_constraint),
      attendees: input_filter.email_list_only_tester(attendees)
    }
    console.log(req.body);
    console.log(booking_info);
    for (let key in booking_info) if (booking_info[key].ret === false) {
      res.json({
        error: "input not vaild.",
        detail: booking_info
      });
      //it ends here, if some value not vaild
      return;
    }
    const ret = {};
    //insert into db
    if (ret.error) {
      res.json({ error: ret.error });
    } else {
      res.json({ payload: ret });
    }
  })
})
//////////////////////////////////////////////

module.exports = bookings;