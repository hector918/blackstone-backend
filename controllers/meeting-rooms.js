const express = require("express");
const meeting_rooms = express.Router();
const input_filter = require('../_input_filter_');
const { create_new_meeting_room, get_all_meeting_rooms, get_room_detail_by_id } = require('../queries/meeting-room');
//////////////////////////////////////////////
meeting_rooms.get('/', async (req, res) => {
  //get all rooms
  await req.general_procedure(req, res, async () => {
    const ret = await get_all_meeting_rooms();
    if (ret.error) {
      res.json({ error: ret.error });
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

meeting_rooms.post('/', async (req, res) => {
  //new
  await req.general_procedure(req, res, async () => {
    let { name, capacity, floor } = req.body;
    //input validation
    const room_info = {
      "name": input_filter.english_letter_space_number_only_tester(name),
      "capacity": input_filter.positive_int_only_tester(capacity),
      "floor": input_filter.int_only_tester(floor)
    };
    for (let key in room_info) if (room_info[key].ret === false) {
      res.json({
        error: "input not vaild.",
        detail: room_info
      })
      //it ends here, if some value not vaild
      return;
    }
    //if all good, insert to db
    const user_profile = req.oidc.user;
    const ret = await create_new_meeting_room({ name, capacity, floor, manager: user_profile.sid, manager_email: user_profile.email });
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
//////////////////////////////////////////////
module.exports = meeting_rooms;