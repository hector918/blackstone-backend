require("dotenv").config();
const express = require("express");
const app = express();
const { auth } = require('express-openid-connect');
const cors = require("cors");
const _auth_ = require('./_auth_');
const { log_error, log, set_log_mode, time_lapse_key_name, log_to_file } = require('./_log_');
const error_code = require('./_error-code_');
const variable = require('./_variable_');
///auth0//////////////////////////////////////
set_log_mode(2);
//auth0 config
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.AUTH0_BASEURL,
  clientID: process.env.AUTH0_CLIENTID,
  issuerBaseURL: process.env.AUTH0_ISSUERBASEURL
};
//middle ware//////////////////////////////////
app.use(cors({ credentials: true, origin: true }));
app.use(express.static("./public"));
app.use(express.json({ type: "application/json", limit: variable.json_string_size_limit }));
app.use(auth(config));
app.use((req, res, next) => {
  //preset log function, it logs to file, in /logs folder, check _log_.js for more detail.
  req[time_lapse_key_name] = new Date().getTime();
  req.log = function () { log(req.route, ...arguments) };
  req.log_error = function (error) {
    const serializedError = JSON.stringify(error, Object.getOwnPropertyNames(error));
    log_error(req, res, req.route, serializedError);
  };
  req.on("end", () => log_to_file(req, res));
  req.general_procedure = general_procedure;
  next();
})
//routes///////////////////////////////////////
//controller
app.use('/api/meeting-rooms', _auth_.verify_auth, require('./controllers/meeting-rooms'));
app.use('/api/bookings', _auth_.verify_auth, require('./controllers/bookings'));
//base route
//route explain: /login, /logout, /callback are taken by auth0//
app.get('/set_first_user_as_admin', async (req, res) => {
  await general_procedure(req, res, async () => {
    const ret = await user.set_first_user_as_admin();
    res.json({ payload: ret });
  })
})
app.get('/is_auth', _auth_.get_user_profile);
app.get('*', (req, res) => {
  res.status(404).send(error_code.code404());
})
///helper///////////////////////////////////////////
async function general_procedure(req, res, fn) {
  try {
    await fn();
  } catch (error) {
    req.log_error(error);
    const message = error_code.message(error.message);
    const code = message !== error.message ? error.message : 500;
    res.status(Number(code)).json({ error: message });
  }
}
///export/////////////////////////////////////////////
module.exports = app;