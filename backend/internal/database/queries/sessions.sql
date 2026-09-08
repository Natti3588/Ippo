-- name: CreateSession :exec
INSERT INTO sessions (id, user_id, expires_at)
VALUES (?, ?, ?);

-- name: GetSessionWithUser :one
SELECT
  s.id AS session_id,
  s.expires_at AS expires_at,
  u.id AS user_id,
  u.display_name AS display_name,
  u.email AS email
FROM sessions s
JOIN users u ON u.id = s.user_id
WHERE s.id = ?
AND s.expires_at > sqlc.arg(now);

-- name: DeleteSession :exec
DELETE FROM sessions
WHERE id = ?;