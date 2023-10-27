const express = require("express");
const meeting_rooms = express.Router();
//////////////////////////////////////////////
meeting_rooms.get('/', async (req, res) => {
  //
})
meeting_rooms.post('/', async (req, res) => {
  //new
})
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