function verify_auth(req, res, next) {
  if (!req.oidc.isAuthenticated()) return code_403(req, res);
  next();
}

function code_403(req, res) {
  res.send("<h1>403 Forbidden</h1>");
}

function get_user_profile(req) {
  return (req?.oidc?.user || null);
}

module.exports = { verify_auth, get_user_profile };