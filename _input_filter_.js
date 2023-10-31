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
function start_date_tester(datetime, constraint = 30) {
  const start_date = new Date(datetime);
  const ret = isDateInRange(start_date, new Date(), getFutureDate(constraint));
  return {
    ret,
    explain: `The start date must later than current and within the next ${constraint} days`,
    constraint
  }
}
function start_date_filter(start_date) {
  return new Date(start_date);
}
function end_date_filter(end_date) {
  return new Date(end_date);
}
function end_date_tester(start_date, end_date, constraint = 30) {
  const ret = isDateInRange(new Date(end_date), new Date(start_date), getFutureDate(constraint));
  return {
    ret,
    explain: `The end date must be later than the start date and within the next ${constraint} days.`,
    constraint
  }
}
function email_list_only_tester(emails) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  let ret = true;
  for (let email of emails) ret &= emailRegex.test(email);
  return { ret: ret == 1, explain: "email address only." }
}
function email_list_only_filter(emails) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const ret = [];
  for (let email of emails) if (emailRegex.test(email)) ret.push(email);
  return ret;
}
function operater_filter(op) {
  switch (op) {
    case ">": return ">";
    case "<": return "<";
    case "=": return "=";
    default: return undefined;
  }
}

function auth0_sid_filter(sid) {
  var pattern = /^[0-9a-zA-Z-]+$/;
  var match = sid.match(pattern);

  if (match) {
    return match[0];
  } else return "";
}
const filter_val = (val, filter) => {
  if (val === undefined) throw new Error("The input value does not match our map.")
  if (filter) return filter(val);
  return null;
}
//hepler/////////////////////////////
function isDateInRange(dateToCheck, startDate, endDate) {
  return dateToCheck >= startDate && dateToCheck <= endDate;
}
function getFutureDate(future) {
  var today = new Date();
  today.setDate(today.getDate() + future);
  return today;
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
  start_date_tester,
  start_date_filter,
  end_date_tester,
  end_date_filter,
  email_list_only_tester,
  email_list_only_filter,
  auth0_sid_filter,
  operater_filter,
  filter_val
}