const mysql = require("mysql2");

let pool;

// Use Aiven connection string if available
const connectionString = process.env.MYSQL_URL || process.env.DATABASE_URL;

if (connectionString) {
  pool = mysql.createPool(connectionString);
} else {
  pool = mysql.createPool({
    host: "mysql-73f09ea-pvvrinda505-333c.b.aivencloud.com", // your Aiven host
    port: 13146,                                             // your Aiven port
    user: "avnadmin",                                        // your Aiven user
    password: "YOUR_PASSWORD_HERE",                          // reveal from Aiven
    database: "defaultdb",                                   // your Aiven database
    ssl: { rejectUnauthorized: true },                       // Aiven requires SSL
    waitForConnections: true,
    connectionLimit: 10,
  });
}

module.exports = pool;
