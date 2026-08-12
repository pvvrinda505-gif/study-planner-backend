// IMPORTANT: must require "mysql2/promise" (not plain "mysql2") so that
// pool.query() returns real Promises — supporting .then()/.catch()/await.
// Using plain "mysql2" here was causing:
//   "You have tried to call .then()... on result of query that is not a promise"
const mysql = require("mysql2/promise");

const connectionString = process.env.MYSQL_URL || process.env.DATABASE_URL;

const baseConfig = connectionString
  ? { uri: connectionString }
  : {
      host: process.env.MYSQLHOST || process.env.DB_HOST,
      port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
      user: process.env.MYSQLUSER || process.env.DB_USER,
      password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
      database: process.env.MYSQLDATABASE || process.env.DB_NAME,
    };

// Aiven requires an encrypted connection, but we deliberately skip strict
// certificate-chain verification here (rejectUnauthorized: false) instead
// of relying on a pasted CA certificate — pasting a multi-line certificate
// into a dashboard text box is fragile and was causing:
//   "Error: self-signed certificate in certificate chain"
// The connection is still encrypted; this only skips verifying Aiven's
// certificate identity, which is an acceptable tradeoff here.
if (process.env.DB_SSL !== "false") {
  baseConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool({
  ...baseConfig,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
