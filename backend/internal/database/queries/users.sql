-- name: CreateUser :exec
INSERT INTO users (id, display_name, email, password_hash)
VALUES (?, ?, ?, ?);

-- name: GetUserByEmail :one
SELECT id, display_name, created_at, email, password_hash
FROM users
WHERE email = ?;

-- name: UpdateUserDisplayName :exec
UPDATE users
SET display_name = ?
WHERE id = ?;