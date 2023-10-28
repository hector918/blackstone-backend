function english_letter_space_number_only_filter(s) {
  s = s.slice(0, 100);
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
function positive_number_only_tester(n) {
  return {
    ret: Number(n) >= 0,
    explian: "only accept positive number."
  }
}
/////////////////////////////
module.exports = {
  english_letter_space_number_only_filter,
  english_letter_space_number_only_tester,
  number_only_tester,
  positive_number_only_tester,

}