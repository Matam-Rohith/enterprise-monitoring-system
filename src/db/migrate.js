const { query } = require('./index');
const fs = require('fs');
const path = require('path');
async function runMigrations() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await query(schema);
}
module.exports = { runMigrations };
