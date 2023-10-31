const { single_user_mode, single_user_user_profile } = require('./_variable_');

////////////////////////////////////////////////
async function verify_auth(req, res, next) {
  //if single user mode, skip the session check
  if (single_user_mode === "true") {
    req.oidc = { user: single_user_user_profile };
    next();
  } else if (req.oidc?.isAuthenticated()) {
    next();
  } else if (req.path === "/login" || req.path === "/callback" || req.path === "/logout") {
    next();
  } else {
    req.log("unknow", req.oidc, req.path)
    // return redirect_to_login(req, res);
  }
}
async function redirect_to_login(req, res) {
  console.log("trying to redirect")
  res.statusCode = 302;
  res.setHeader('Location', "/login");
  res.end();
}
async function code_403(req, res) {
  await req.general_procedure(req, res, () => {
    throw new Error(403);
  })
}

function get_user_profile(req) {
  return (req?.oidc?.user || null);
}
////////////////////////////////////////////////
module.exports = { verify_auth, get_user_profile };