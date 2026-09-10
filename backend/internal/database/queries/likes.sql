-- name: CreateLike :exec
INSERT INTO likes (post_id, author_id)
VALUES (?, ?)
ON DUPLICATE KEY UPDATE post_id = post_id;

-- name: DeleteLike :exec
DELETE FROM likes
WHERE post_id = ? AND author_id = ?;
