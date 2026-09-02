-- name: ListTopics :many
SELECT id, slug, name, display_order
FROM topics
ORDER BY display_order ASC, slug ASC;