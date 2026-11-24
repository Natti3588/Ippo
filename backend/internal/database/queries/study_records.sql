-- name: CreateStudyRecord :exec
INSERT INTO study_records (user_id, studied_on)
VALUES (?, ?)
ON DUPLICATE KEY UPDATE user_id = user_id;

-- name: ListStudyDatesByUser :many
SELECT
  studied_on
FROM study_records
WHERE user_id = ?
ORDER BY studied_on DESC;