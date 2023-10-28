const express = require("express");
const meeting_rooms = express.Router();
const input_filter = require('../_input_filter_');
//////////////////////////////////////////////
meeting_rooms.get('/', async (req, res) => {
  //

});

meeting_rooms.post('/', async (req, res) => {
  //new
  general_procedure(req, res, () => {
    let { name, capacity, floor } = req.body;
    const ret = {
      "name": input_filter.english_letter_space_number_only_tester(name),
      "capacity": input_filter.positive_number_only_tester(capacity),
      "floor": input_filter.number_only_tester(floor)
    };
    console.log(ret);
    for (let key in ret) if (ret[key].ret === false) {
      res.json({
        error: "input not vaild.",
        detail: ret
      })
      //it ends here, if some value not vaild
      return;
    }
    //if all good, insert to db
    res.send("123")
  })

});
//////////////////////////////////////////////

//////////////////////////////////////////////
function general_procedure(req, res, fn) {
  try {
    fn();
  } catch (error) {
    req.log_error(error);
    const message = error_code.message(error.message);
    const code = message !== error.message ? error.message : 500;
    res.status(code).json({ error: message });
  }
}
//////////////////////////////////////////////
module.exports = meeting_rooms;