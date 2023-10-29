const error_code = {
  401: "you need to login first.",
  403: "Forbidden.",
  400: "Bad Request."
}
const message = (code) => {
  if (error_code[code] !== undefined) return error_code[code];
  return code;
}

module.exports = { message }