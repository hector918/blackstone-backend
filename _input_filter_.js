function english_letter_space_number_only_filter(s, size = 100) {
  s = s.slice(0, size);
  return s.replace(/[^A-Za-z0-9\s]/g, '');
}
function english_letter_space_number_only_tester(s) {
  return {
    ret: /^[A-Za-z0-9\s]{1,100}$/.test(s),
    explian: "only accept english letter, number and space."
  };
}
function number_only_tester(n) {
  return {
    ret: !isNaN(Number(n)),
    explian: "only accept number."
  }
}
function number_only_filter(n) {
  return isNaN(Number(n)) ? 0 : Number(n);
}

function positive_number_only_tester(n) {
  return {
    ret: Number(n) >= 0,
    explian: "only accept positive number."
  }
}
function positive_number_only_filter(n) {
  return Number(n) >= 0 ? Number(n) : 1;
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
/////////////////////////////
module.exports = {
  english_letter_space_number_only_filter,
  english_letter_space_number_only_tester,
  number_only_tester,
  number_only_filter,
  positive_number_only_tester,
  positive_number_only_filter,
  english_name_only_filter,
  email_only_filter,
  string_filter
}