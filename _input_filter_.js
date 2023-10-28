function english_letter_space_number_only_filter(s, size = 100) {
  s = s.slice(0, size);
  return s.replace(/[^A-Za-z0-9\s]/g, '');
}
function english_letter_space_number_only_tester(s) {
  return {
    ret: /^[A-Za-z0-9\s]{1,100}$/.test(s),
    explain: "only accept english letter, number and space."
  };
}
function int_only_tester(n) {
  return {
    ret: Number.isInteger(Number(n)),
    explain: "only accept Integer."
  }
}
function int_only_filter(n) {
  return Number.isInteger(Number(n)) ? Number(n) : 0;
}

function positive_int_only_tester(n) {
  return {
    ret: Number.isInteger(Number(n)) && Number(n) > 0,
    explain: "only accept positive Integer."
  }
}
function positive_int_only_filter(n) {
  return Number(n) > 0 ? Math.round(Number(n)) : 1;
}
function english_name_only_filter(s) {
  return s.replace(/[^A-Za-z\s'-]+/g, '');
}
function email_only_filter(email) {
  const emailAddresses = email.match(/[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/);
  return emailAddresses ? emailAddresses[0] : "";
}
function string_filter(s) {
  return s.toString();
}
const filter_val = (val, filter) => {
  if (val === undefined) throw new Error("The input value does not match our map.")
  if (filter) return filter(val);
  return null;
}
/////////////////////////////
module.exports = {
  english_letter_space_number_only_filter,
  english_letter_space_number_only_tester,
  int_only_tester,
  int_only_filter,
  positive_int_only_filter,
  positive_int_only_tester,
  english_name_only_filter,
  email_only_filter,
  string_filter,
  filter_val
}