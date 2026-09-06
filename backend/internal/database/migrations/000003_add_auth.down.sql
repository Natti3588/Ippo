DROP TABLE IF EXISTS sessions;

ALTER TABLE users
  DROP COLUMN password_hash,
  DROP COLUMN email;
