-- name: ListPostsByTopicPopular :many
SELECT
  p.id,
  p.body,
  u.display_name AS author_name,
  COUNT(l.post_id) AS like_count,
  p.created_at
FROM posts p
JOIN users u ON u.id = p.author_id
LEFT JOIN likes l ON l.post_id = p.id
WHERE p.topic_id = $1
GROUP BY p.id, u.display_name
ORDER BY like_count DESC, p.created_at DESC;

-- name: ListPostsByTopicNewest :many
SELECT
  p.id,
  p.body,
  u.display_name AS author_name,
  COUNT(l.post_id) AS like_count,
  p.created_at
FROM posts p
JOIN users u ON u.id = p.author_id
LEFT JOIN likes l ON l.post_id = p.id
WHERE p.topic_id = $1
GROUP BY p.id, u.display_name
ORDER BY p.created_at DESC;

-- name: ListPostsByTopicOldest :many
SELECT
  p.id,
  p.body,
  u.display_name AS author_name,
  COUNT(l.post_id) AS like_count,
  p.created_at
FROM posts p
JOIN users u ON u.id = p.author_id
LEFT JOIN likes l ON l.post_id = p.id
WHERE p.topic_id = $1
GROUP BY p.id, u.display_name
ORDER BY p.created_at ASC;