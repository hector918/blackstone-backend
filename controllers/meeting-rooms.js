const express = require("express");
const meeting_rooms = express.Router();
const input_filter = require('../_input_filter_');
const { create_new_meeting_room, get_all_meeting_rooms, get_room_detail_by_id, search_available_room } = require('../queries/meeting-room');
const booking = require('../queries/bookings');
const { error } = require("console");
//////////////////////////////////////////////
meeting_rooms.get('/', async (req, res) => {
  //list all meeting rooms
  await req.general_procedure(req, res, async () => {
    const ret = await get_all_meeting_rooms();
    if (ret.error) {
      res.json({ error: ret.error });
    } else {
      res.json({ payload: ret });
    }
  })
});

meeting_rooms.post('/', async (req, res) => {
  //create a meeting room 
  await req.general_procedure(req, res, async () => {
    let { name, capacity, floor } = req.body;
    //input validation
    const vaildation = {
      "name": input_filter.english_letter_space_number_only_tester(name),
      "capacity": input_filter.positive_int_only_tester(capacity),
      "floor": input_filter.int_only_tester(floor)
    };
    for (let key in vaildation) if (vaildation[key].ret === false) {
      res.json({
        error: "input not vaild.",
        detail: vaildation
      })
      //it ends here, if some value not vaild
      return;
    }
    //if all good, insert to db
    const user_profile = req.oidc.user;
    const ret = await create_new_meeting_room({ name, capacity, floor, manager: user_profile.sub, manager_email: user_profile.email });
    if (ret.error) {
      res.json({
        error: ret.error.message, detail: {
          summary: {
            ret: false,
            explain: ret.error.message
          }
        }
      });
    } else {
      res.json({ payload: ret });
    }
  })

});

meeting_rooms.get('/:id', async (req, res) => {
  //get room by id
  const { id } = req.params;
  if (!input_filter.positive_int_only_tester(id)) {
    throw new Error(400);
  }
  await req.general_procedure(req, res, async () => {
    const { room, error } = await get_room_detail_by_id(id);
    if (error !== undefined) throw new Error(error);
    res.json({ payload: { room } });
  })
});

meeting_rooms.get('/:id/bookings', async (req, res) => {
  //future bookings by meeting room id
  const { id: meeting_room_id } = req.params;
  await req.general_procedure(req, res, async () => {
    //vaildation
    const vaildation = input_filter.positive_int_only_tester(meeting_room_id);
    if (vaildation.ret === false) {
      res.json({ error: vaildation.explain });
    } else {
      //go db  
      const ret = await booking.get_future_bookings_by_meeting_room_id(meeting_room_id);
      if (ret.error !== undefined) throw new Error(error.message);
      res.json({ payload: ret });
    }

  })
})

meeting_rooms.post('/available', async (req, res) => {
  //search available room by post
  search_for_available_rooms_helper(req, res, req.body);
});
meeting_rooms.get('/available', async (req, res) => {
  //search available room by query string
  search_for_available_rooms_helper(req, res, req.params);
});
//helper//////////////////////////////////////
async function search_for_available_rooms_helper(req, res, form) {
  const { startDate, endDate, capacity, capacityOp, floor, floorOp } = form;

  await req.general_procedure(req, res, async () => {
    //validation
    const form = {};
    if (input_filter.start_date_tester(startDate).ret === true) form["start_date"] = startDate;
    if (input_filter.start_date_tester(endDate).ret === true) form["end_date"] = endDate;
    if (input_filter.positive_int_only_tester(capacity).ret === true) {
      form['capacity'] = capacity;
      form['capacityOp'] = input_filter.operater_filter(capacityOp);
    }
    if (input_filter.int_only_tester(floor).ret === true) {
      form['floor'] = floor;
      form['floorOp'] = input_filter.operater_filter(floorOp);
    }
    //db op
    const ret = await search_available_room(form);
    if (ret.error) {
      throw new Error(ret.error.message);
    } else {
      res.json({ payload: ret });
    }
  })
}

//////////////////////////////////////////////
module.exports = meeting_rooms;