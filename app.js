const express = require("express");
const app = express();
const { auth } = require('express-openid-connect');
require("dotenv").config();
const cors = require("cors");
const { verify_auth, get_user_profile } = require('./_auth_');
const { log_error, log, set_debug_mode, time_lapse_key_name, log_to_file } = require('./_log_');
const error_code = require('./_error-code_');
const variable = require('./_variable_');
///auth0//////////////////////////////////////
set_debug_mode(true);
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH_SECRET,
  baseURL: 'https://localhost:3001',
  clientID: 'n4AbKZtipsZqrYoJCgeNNfaTpdZmwECK',
  issuerBaseURL: 'https://dev-2rc87pi2gm2ieibf.us.auth0.com'
};
//middle ware//////////////////////////////////
app.use(cors({ credentials: true, origin: true }));
app.use(express.static("./public"));
app.use(express.json({ type: "application/json", limit: variable.json_string_size_limit }));
app.use(auth(config));
app.use((req, res, next) => {
  //preset log function, it logs to file, in /logs folder, check _log_.js for more detail.
  req.log_start_time = new Date().getTime();
  req.log = function () { log(req.route, ...arguments) };
  req.log_error = function (error) {
    const serializedError = JSON.stringify(error, Object.getOwnPropertyNames(error));
    log_error(req, res, req.route, serializedError);
  };
  req.on("end", () => log_to_file(req, res));
  next();
})
//routes///////////////////////////////////////
app.use('/api/meeting-rooms', require('./controllers/meeting-rooms'));
app.use('/api/bookings', require('./controllers/bookings'));
//: /login, /logout, /callback are taken by auth// 
app.get('/is_auth', (req, res) => {
  general_procedure(req, res, () => {
    if (variable.single_user_mode) {
      res.json({
        payload:
        {
          user_profile: variable.single_user_user_profile
        }
      });
      //if single user mode, skip the session checking
      return;
    }
    if (!req.oidc.isAuthenticated()) throw new Error(401);
    const user_profile = req?.oidc?.user;
    res.json({ payload: { user_profile } });
  })
});
app.get('/check_single_user_mode', (req, res) => {
  general_procedure(req, res, () => {
    res.json({
      payload: variable.single_user_mode,
      user: variable.single_user_user_profile
    });
  })
})
//404
app.get('*', (req, res) => {
  res.status(404).send("file not found.");
})
////////////////////////////////////////////////
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
///export/////////////////////////////////////////////
module.exports = app;