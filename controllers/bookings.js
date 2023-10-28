const express = require("express");
const bookings = express.Router();
const bookings_table_name = '\"blackstone-bookings\"';
//////////////////////////////////////////////
bookings.get('/', async (req, res) => {

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
module.exports = bookings;