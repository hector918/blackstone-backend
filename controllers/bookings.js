const express = require("express");
const bookings = express.Router();
//////////////////////////////////////////////
bookings.get('/', async (req, res) => {

})
//////////////////////////////////////////////
function general_procedure(req, res, fn) {
  try {
    fn();
  } catch (error) {
    req.log_error(error);
    const code = error_code.message(error.message) !== error.message ? error.message : 500;
    res.status(code).json({ error: error_code.message(error.message) });
  }
}
module.exports = bookings;