-- LEFT(p.body, 200) はこのファイルに3回現れる。長さを変えるときは3本すべて揃えること。
-- 1本だけ変えても SQL も Go もエラーにならず、同じ投稿が並び順によって
-- 違う長さのプレビューを返すだけになる。詳細は repository/convert.go の
-- toDomainPostSummary のコメントを参照。

-- name: ListPostsByTopicPopular :many
SELECT
  p.id,
  p.title,
  LEFT(p.body, 200)   AS body_preview,
  CHAR_LENGTH(p.body) AS body_length,
  u.display_name AS author_name,
  COUNT(l.post_id) AS like_count,
  p.created_at
FROM posts p
JOIN users u ON u.id = p.author_id
LEFT JOIN likes l ON l.post_id = p.id
WHERE p.topic_id = ?
GROUP BY p.id, u.display_name
ORDER BY like_count DESC, p.created_at DESC, p.id DESC;

-- name: ListPostsByTopicNewest :many
SELECT
  p.id,
  p.title,
  LEFT(p.body, 200)   AS body_preview,
  CHAR_LENGTH(p.body) AS body_length,
  u.display_name AS author_name,
  COUNT(l.post_id) AS like_count,
  p.created_at
FROM posts p
JOIN users u ON u.id = p.author_id
LEFT JOIN likes l ON l.post_id = p.id
WHERE p.topic_id = ?
GROUP BY p.id, u.display_name
ORDER BY p.created_at DESC, p.id DESC;

-- name: ListPostsByTopicOldest :many
SELECT
  p.id,
  p.title,
  LEFT(p.body, 200)   AS body_preview,
  CHAR_LENGTH(p.body) AS body_length,
  u.display_name AS author_name,
  COUNT(l.post_id) AS like_count,
  p.created_at
FROM posts p
JOIN users u ON u.id = p.author_id
LEFT JOIN likes l ON l.post_id = p.id
WHERE p.topic_id = ?
GROUP BY p.id, u.display_name
ORDER BY p.created_at ASC, p.id ASC;

-- name: CreatePost :exec
INSERT INTO posts (id, topic_id, author_id, title, body, created_at)
VALUES (?, ?, ?, ?, ?, ?);

-- name: GetPostById :one
SELECT
  p.id,
  p.title,
  p.body,
  u.display_name AS author_name,
  COUNT(l.post_id) AS like_count,
  p.created_at
FROM posts p
JOIN users u ON u.id = p.author_id
LEFT JOIN likes l ON l.post_id = p.id
WHERE p.id = ?
GROUP BY p.id, u.display_name;
