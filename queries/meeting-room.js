const db = require("../db/db-config");
const { log_error, performance_timer } = require('../logs_.js');
////////////////////////////////////////////////

////////////////////////////////////////////////
async function genenal_query_procedure(task) {
  const pt = new performance_timer(`event - ${task.toString()}`);
  //draw an connection from the pool
  const connection = await db.connect();
  try {
    pt.add_tick("start task");
    const ret = task(connection, pt);
    pt.add_tick("end task");
    return ret;
  } catch (error) {
    log_error(error);
    return false;
  } finally {
    pt.done();
    if (connection) connection.done();
  }
}
/////////////////////////////
module.exports = {}