const variable = require('./_variable_');
const db_user = require('./queries/user');
console.log("single user mode", variable.single_user_mode);
////////////////////////////////////////////////
async function verify_auth(req, res, next) {
  //if single user mode, skip the session check
  if (variable.single_user_mode === true) {
    req.oidc = { user: variable.single_user_user_profile };
    next();
  } else if (req.oidc?.isAuthenticated()) {
    next();
  } else if (req.path === "/login" || req.path === "/callback" || req.path === "/logout") {
    next();
  } else {
    req.log("unknown", req.oidc, req.path)
    return code_403(req, res);
  }
}

async function code_403(req, res) {
  await req.general_procedure(req, res, () => {
    throw new Error(403);
  })
}

async function get_user_profile(req, res) {
  await req.general_procedure(req, res, async () => {
    if (variable.single_user_mode === false) {
      //if not in single user mode, needs to check user login status
      if (req.oidc.isAuthenticated() === false) throw new Error(401);
    } else if (variable.single_user_mode === true) {
      //if single user mode, user profile draw from _variable_.js
      req.oidc = { user: variable.single_user_user_profile };
    } else {
      req.log("in is auth path, unhandle event");
    }
    //return user profile, if that is an new user, user_profile.from_db will be undefined
    let user_profile = req?.oidc?.user;
    user_profile.from_db = await db_user.get_user_info_by_sub(req.oidc.user.sub);
    //user_profile.from_db = await db_user.get_user_info_by_email(req.oidc.user.email);
    res.json({ payload: { user_profile } });
    //update user status to db
    await db_user.register_user_status(user_profile);
  })
}


////////////////////////////////////////////////
module.exports = { verify_auth, get_user_profile };