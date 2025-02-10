const db = require('../config/db')

const error404 = async (req, res) => {
  try {
    /* const table = await db.query(
      `CREATE TYPE genstatus AS ENUM ('active', 'suspended');
CREATE TYPE appstatus AS ENUM ('new', 'approved', 'rejected', 'arrived', 'inprogress', 'complete', 'invoiced');
CREATE TYPE labstatus AS ENUM ('new', 'completed', 'rejected');
CREATE TYPE medstatus AS ENUM ('new', 'completed', 'rejected');
CREATE TYPE invstatus AS ENUM ('new', 'paid');
CREATE TYPE roles AS ENUM ('admin', 'doctor', 'patient', 'receptionist', 'laboratorist', 'pharmacist', 'accountant');


DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  photoPath VARCHAR NOT NULL DEFAULT '',
  photoId VARCHAR NOT NULL DEFAULT '',
  cpr VARCHAR NOT NULL,
  username VARCHAR NOT NULL,
  password VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  phone VARCHAR NOT NULL DEFAULT '',
  role roles NOT NULL DEFAULT 'patient',
  status genstatus NOT NULL DEFAULT 'active',
  notes VARCHAR NOT NULL DEFAULT '',
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

DROP TABLE IF EXISTS medicines;
CREATE TABLE medicines (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  pharmForm VARCHAR NOT NULL DEFAULT '',
  activeSubs VARCHAR NOT NULL DEFAULT '',
  roa VARCHAR NOT NULL DEFAULT'',
  price NUMERIC(10, 3) NOT NULL,
  status genstatus NOT NULL DEFAULT 'active',
  notes VARCHAR NOT NULL DEFAULT '',
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

DROP TABLE IF EXISTS icd;
CREATE TABLE icd (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  code VARCHAR NOT NULL,
  detailsUrl VARCHAR NOT NULL DEFAULT '',
  status genstatus NOT NULL DEFAULT 'active',
  notes VARCHAR NOT NULL DEFAULT '',
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

DROP TABLE IF EXISTS labTests;
CREATE TABLE labTests (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  type VARCHAR NOT NULL DEFAULT '',
  price NUMERIC(10, 3) NOT NULL,
  description VARCHAR NOT NULL DEFAULT '',
  status genstatus NOT NULL DEFAULT 'active',
  notes VARCHAR NOT NULL DEFAULT '',
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

DROP TABLE IF EXISTS services;
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  price NUMERIC(10, 3) NOT NULL,
  duration INTEGER NOT NULL,
  description VARCHAR NOT NULL DEFAULT '',
  status genstatus NOT NULL DEFAULT 'active',
  notes VARCHAR NOT NULL DEFAULT '',
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

DROP TABLE IF EXISTS doctorsServices;
CREATE TABLE doctorsServices (
  id SERIAL PRIMARY KEY,
  doctorId INTEGER NOT NULL,
  serviceId INTEGER NOT NULL,
  status genstatus NOT NULL DEFAULT 'active',
  notes VARCHAR NOT NULL DEFAULT '',
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

DROP TABLE IF EXISTS appointments;
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  patientId INTEGER NOT NULL,
  serviceId INTEGER NOT NULL,
  doctorId INTEGER NOT NULL,
  appointmentDate TIMESTAMP NOT NULL,
  description VARCHAR NOT NULL DEFAULT '',
  source VARCHAR NOT NULL DEFAULT 'web',
  status appstatus NOT NULL DEFAULT 'new',
  notes VARCHAR NOT NULL DEFAULT '',
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

DROP TABLE IF EXISTS labRequests;
CREATE TABLE labRequests (
  id SERIAL PRIMARY KEY,
  appointmentId INTEGER NOT NULL,
  diagnosticId INTEGER NOT NULL,
  resultPath VARCHAR NOT NULL DEFAULT '',
  resultId VARCHAR NOT NULL DEFAULT '',
  reporterId INTEGER NOT NULL DEFAULT 0,
  status labstatus NOT NULL DEFAULT 'new',
  notes VARCHAR NOT NULL DEFAULT '',
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

DROP TABLE IF EXISTS medicinesRequests;
CREATE TABLE medicinesRequests (
  id SERIAL PRIMARY KEY,
  appointmentId INTEGER NOT NULL,
  medicineId INTEGER NOT NULL,
  pharmaciestId INTEGER,
  period INTEGER NOT NULL,
  dosage VARCHAR NOT NULL,
  status medstatus NOT NULL DEFAULT 'new',
  notes VARCHAR NOT NULL DEFAULT '',
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

DROP TABLE IF EXISTS invoices;
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  appointmentId INTEGER NOT NULL,
  issuerId INTEGER NOT NULL,
  data VARCHAR NOT NULL,
  amount NUMERIC(10, 3) NOT NULL,
  status invstatus NOT NULL DEFAULT 'new',
  notes VARCHAR NOT NULL DEFAULT '',
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

DROP TABLE IF EXISTS prescriptions;
CREATE TABLE prescriptions (
  id SERIAL PRIMARY KEY,
  appointmentId INTEGER NOT NULL,
  icdId INTEGER NOT NULL,
  caseHistory VARCHAR NOT NULL DEFAULT '',
  Medication VARCHAR NOT NULL DEFAULT '',
  status genstatus NOT NULL DEFAULT 'active',
  notes VARCHAR NOT NULL DEFAULT '',
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE doctorsServices ADD FOREIGN KEY (doctorId) REFERENCES users (id);
ALTER TABLE doctorsServices ADD FOREIGN KEY (serviceId) REFERENCES services (id);

ALTER TABLE appointments ADD FOREIGN KEY (patientId) REFERENCES users (id);
ALTER TABLE appointments ADD FOREIGN KEY (doctorId) REFERENCES users (id);
ALTER TABLE appointments ADD FOREIGN KEY (serviceId) REFERENCES services (id);

ALTER TABLE labRequests ADD FOREIGN KEY (appointmentId) REFERENCES appointments (id);
ALTER TABLE labRequests ADD FOREIGN KEY (diagnosticId) REFERENCES labTests (id);
ALTER TABLE labRequests ADD FOREIGN KEY (reporterId) REFERENCES users (id);

ALTER TABLE medicinesRequests ADD FOREIGN KEY (appointmentId) REFERENCES appointments (id);
ALTER TABLE medicinesRequests ADD FOREIGN KEY (medicineId) REFERENCES medicines (id);
ALTER TABLE medicinesRequests ADD FOREIGN KEY (pharmaciestId) REFERENCES users (id);

ALTER TABLE invoices ADD FOREIGN KEY (appointmentId) REFERENCES appointments (id);
ALTER TABLE invoices ADD FOREIGN KEY (issuerId) REFERENCES users (id);

ALTER TABLE prescriptions ADD FOREIGN KEY (appointmentId) REFERENCES appointments (id);
ALTER TABLE prescriptions ADD FOREIGN KEY (icdId) REFERENCES icd (id);
`
    )
    console.log(table) */
    message = 'You are trying to enter in non-exist page!'
    res.status(200).json({ error: message })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { error404 }
