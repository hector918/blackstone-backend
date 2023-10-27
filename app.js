const express = require("express");
const app = express();
const { auth } = require('express-openid-connect');
require("dotenv").config();
const { verify_auth, get_user_profile } = require('./_auth_');
const { log_error, log, set_debug_mode, time_lapse_key_name, log_to_file } = require('./_log_');
///auth0//////////////////////////////////////
set_debug_mode(true);
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH_SECRET,
  baseURL: 'https://localhost:3000',
  clientID: 'n4AbKZtipsZqrYoJCgeNNfaTpdZmwECK',
  issuerBaseURL: 'https://dev-2rc87pi2gm2ieibf.us.auth0.com'
};
//middle ware//////////////////////////////////
app.use(express.static("./public"));
app.use(auth(config));
app.use((req, res, next) => {
  req.log_start_time = new Date().getTime();
  req.log = function () { log(req.route, ...arguments) };
  req.log_error = function () { log_error(req, res, req.route, ...arguments) };
  req.on("end", () => log_to_file(req, res));
  next();
})
//routes///////////////////////////////////////
//: /login, /logout, /callback are taken by auth// 
app.get('/is_auth', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});
//404
app.get('*', verify_auth, (req, res) => {
  res.send("404 file not found.");
})
///export/////////////////////////////////////////////
module.exports = app;