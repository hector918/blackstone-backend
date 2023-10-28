const express = require("express");
const app = express();
const { auth } = require('express-openid-connect');
require("dotenv").config();
const cors = require("cors");
const { verify_auth, get_user_profile } = require('./_auth_');
const { log_error, log, set_log_mode, time_lapse_key_name, log_to_file } = require('./_log_');
const error_code = require('./_error-code_');
const variable = require('./_variable_');
const db_user = require('./queries/user');
///auth0//////////////////////////////////////
set_log_mode(1);
//auth0 config
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
app.use('/api/meeting-rooms', verify_auth, require('./controllers/meeting-rooms'));
app.use('/api/bookings', verify_auth, require('./controllers/bookings'));
//base route
//route explain: /login, /logout, /callback are taken by auth0//
app.get('/set_first_user_as_admin', async (req, res) => {
  await general_procedure(req, res, async () => {
    const ret = await user.set_first_user_as_admin();
    res.json({ payload: ret });
  })
})
app.get('/is_auth', async (req, res) => {
  await general_procedure(req, res, async () => {
    if (variable.single_user_mode === false) {
      //if not in single user mode, needs to check user login status
      if (!req.oidc.isAuthenticated()) throw new Error(401);
    } else {
      //if single user mode, user profile draw from _variable_.js
      req.oidc = { user: variable.single_user_user_profile };
    }
    //return user profile
    let user_profile = req?.oidc?.user;
    res.json({ payload: { user_profile } });
    //update user status to db
    await db_user.register_user_status(user_profile);
  })
});
app.get('*', (req, res) => {
  res.status(404).send("file not found.");
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