const { single_user_mode, single_user_user_profile } = require('./_variable_');
////////////////////////////////////////////////
function verify_auth(req, res, next) {
  //if single user mode, skip the session check
  if (single_user_mode) {
    req.oidc = { user: single_user_user_profile };
  } else if (!req.oidc.isAuthenticated()) return code_403(req, res);
  next();
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