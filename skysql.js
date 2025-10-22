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

(async () => {
    try {
        console.log("🚀 Connecting to database...");
        const connection = await mysql.createConnection(config);

        console.log("📦 Creating database and tables...");
        await connection.query(schema);

        console.log("✅ Database and tables created successfully!");
        await connection.end();
    } catch (error) {
        console.error("❌ Error creating database:", error);
    }
})();
