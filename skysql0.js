import mysql from "mysql2/promise";

const config = {
    host: "serverless-eu-west-3.sysp0000.db1.skysql.com",
    user: "dbpwf17093208",
    password: "8%mTD6tcP7GWYMamPMtm2",
    port: 4004,
    ssl: { rejectUnauthorized: true },
};

const schema = `
CREATE DATABASE IF NOT EXISTS partsync;
USE partsync;

CREATE TABLE IF NOT EXISTS cpu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
                                brand VARCHAR(50),
                                model VARCHAR(50),
                                cores INT,
                                threads INT,
                                tdp INT,
                                performance_score INT
);

CREATE TABLE IF NOT EXISTS psu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wattage INT,
    connector_6_pin BOOLEAN,
    connector_8_pin BOOLEAN,
    connector_12_pin BOOLEAN
);

CREATE TABLE IF NOT EXISTS motherboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
                                        chipset VARCHAR(50),
                                        pcie_version VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS gpu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
                                brand VARCHAR(50),
                                vram INT,
                                tdp INT,
                                pcie_version VARCHAR(10),
                                performance_score INT,
                                price INT
);

CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE,
                                  password_hash VARCHAR(255),
                                  otp_code VARCHAR(6),
                                  otp_expires DATETIME,
                                  ip_address VARCHAR(50),
                                  failed_attempts INT DEFAULT 0,
                                  is_blacklisted BOOLEAN DEFAULT FALSE
);
`;

const seedData = async (connection) => {
    console.log("🌱 Inserting initial data...");

    await connection.query(`
    INSERT INTO cpu (name, brand, model, cores, threads, tdp, performance_score) VALUES
    ('Intel Core i5-12400F', 'Intel', 'i5-12400F', 6, 12, 65, 15000),
                           ('AMD Ryzen 5 5600X', 'AMD', '5600X', 6, 12, 65, 14800);
                           `);

    await connection.query(`
    INSERT INTO psu (wattage, connector_6_pin, connector_8_pin, connector_12_pin) VALUES
    (650, TRUE, TRUE, FALSE),
                           (750, TRUE, TRUE, TRUE);
                           `);

    await connection.query(`
    INSERT INTO motherboard (name, chipset, pcie_version) VALUES
    ('ASUS TUF Gaming B550-PLUS', 'B550', '4.0'),
                           ('MSI Z690 PRO-A', 'Z690', '5.0');
                           `);

    await connection.query(`
    INSERT INTO gpu (name, brand, vram, tdp, pcie_version, performance_score, price) VALUES
    ('NVIDIA RTX 3060 Ti', 'NVIDIA', 8, 200, '4.0', 17000, 400),
                           ('AMD RX 6700 XT', 'AMD', 12, 230, '4.0', 17500, 380);
                           `);

    await connection.query(`
    INSERT INTO admin (email, password_hash) VALUES
    ('discordant2020@gmail.com', '$2b$10$teydflz8/N/8qf.F7e9X8u9c.3QzGX9VIiXZZdXxu0pPnBV4qfA1C'); -- Replace with a real bcrypt hash
    `);

    console.log("✅ Data inserted successfully!");
};

(async () => {
    try {
        console.log("🚀 Connecting to database...");
        const connection = await mysql.createConnection(config);

        console.log("📦 Creating database and tables...");
        await connection.query(schema);

        await seedData(connection);

        await connection.end();
        console.log("🎉 Setup complete!");
    } catch (error) {
        console.error("❌ Error:", error);
    }
})();
