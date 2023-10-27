const fs = require('fs');
var debug_mode = true;
const log_file_dir = __dirname + "/logs/";
const log_file_expire_limit = 86_400_000 * 1;// 86400000 = 1 day
const time_lapse_key_name = "log_start_time";
const log_file_remover_timer = setInterval(() => {
  remove_out_date_files();
}, (60 * 1000 * 60 * 12))
////main//////////////////////////////////////
function log_error() {
  const [req, res] = arguments;
  const payload = Object.values(arguments).slice(3);
  console.error(new Date().toLocaleString(), ...payload);
  log_to_file(req, res, "error", payload);
}
function log() {
  console.log(new Date().toLocaleString(), ...arguments);
}

const remove_out_date_files = () => {
  let current_time = new Date().getTime();
  fs.readdir(log_file_dir, (err, files) => {
    if (err) return;
    for (let file of files) {
      let time_diff = (current_time - new Date(file.split("-", 3).join("-")).getTime()) / 86400000;
      if (time_diff > log_file_expire_limit) {
        fs.unlink(`${log_file_dir}${file}`, (err) => {
          console.log(`${file} deleted`, `error :${err}`);
        });
      }
    }
  });
}

function log_to_file(req, res, type = "request", message) {
  let d = new Date();
  let content = {
    date: d.toLocaleString(),
    method: req.method,
    lapse: d.getTime() - req[time_lapse_key_name],
    ip: `${req.socket.remoteAddress}:${req.socket.remotePort}`,
    statusCode: res.statusCode,
    url: req.url,
    message
  }
  fs.writeFile(`${log_file_dir}${get_date(d)}-${type}_log.txt`, JSON.stringify(content) + ",\r\n", { 'flag': 'a' }, writeFile_error_ENOENT);
}

//hepler///////////////////////////
function writeFile_error_ENOENT(err) {
  if (err && err.code == "ENOENT") {
    fs.mkdir(`${log_file_dir}`, () => { });
    console.log(err);
    log_error(err);
  }
}
function get_date(d) {
  return d.toISOString().slice(0, 10);
}
///class///////////////////////////////////////
class performance_timer {
  constructor() {
    if (!debug_mode) return;
    this.start_time = process.uptime();
    this.checkpoint = [];
  }
  add_tick(tick_name) {
    if (!debug_mode) return;
    this.checkpoint.push({
      name: tick_name,
      time: (process.uptime() - this.start_time + " - seconds")
    })
  }
  done() {
    if (!debug_mode) return;
    this.add_tick("ending");
    console.log(this.checkpoint);
  }
}
////mode switcher//////////////////////////////////////
function set_debug_mode(bool) {
  debug_mode = bool;
}
///export///////////////////////////////////////
module.exports = {
  log_error,
  log,
  performance_timer,
  set_debug_mode,
  log_to_file,
  time_lapse_key_name
};