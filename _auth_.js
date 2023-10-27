function verify_auth(req, res, next) {
  if (!req.oidc.isAuthenticated()) return code_403(req, res);
  next();
}

function code_403(req, res) {
  general_procedure(req, res, () => {
    throw new Error(403);
  })
}

function get_user_profile(req) {
  return (req?.oidc?.user || null);
}
////////////////////////////////////////////////
function general_procedure(req, res, fn) {
  try {
    fn();
  } catch (error) {
    req.log_error(error);
    const code = error_code.message(error.message) != error.message || 500;
    res.status(code).json({ error: error_code.message(error.message) });
  }
}
module.exports = { verify_auth, get_user_profile };