require("dotenv").config();
const root_path = __dirname;
var single_user_mode = Boolean(process.env.SINGLE_USER_MODE) || true;
const single_user_user_profile = {
  "sid": "something",
  "given_name": "na",
  "nickname": "Hector",
  "name": "Hector",
  "picture": "https://lh3.googleusercontent.com/a/ACg8ocL5IRRQxIy7tdf5Uxp63Ao3FGK8QRNE6e7QGw0jfKD1I2Y=s96-c",
  "locale": "zh-CN",
  "updated_at": "2023-10-27T20:26:49.508Z",
  "email": "qihectorzhong@pursuit.org",
  "email_verified": true,
  "sub": "google-oauth2|1110543040982930844181"
};
const json_string_size_limit = "1mb";

const booking_datetime_constraint = 30;

/////////////////////////////
module.exports = {
  root_path,
  single_user_mode,
  single_user_user_profile,
  json_string_size_limit,
  booking_datetime_constraint
};