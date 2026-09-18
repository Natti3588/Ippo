-- LEFT(p.body, 200) はこのファイルに3回現れる。長さを変えるときは3本すべて揃えること。
-- 1本だけ変えても SQL も Go もエラーにならず、同じ投稿が並び順によって
-- 違う長さのプレビューを返すだけになる。詳細は repository/convert.go の
-- toDomainPostSummary のコメントを参照。
-- LIMIT / OFFSET も3本すべてに要る。1本だけ足しても SQL も Go もエラーにならず、
-- 並び順を変えただけで突然全件返る一覧ができあがる。

-- name: ListPostsByTopicPopular :many
SELECT
  p.id,
  p.author_id,
  p.title,
  LEFT(p.body, 200)   AS body_preview,
  CHAR_LENGTH(p.body) AS body_length,
  u.display_name AS author_name,
  COUNT(l.post_id) AS like_count,
  EXISTS (
    SELECT 1 FROM likes ml
    WHERE ml.post_id = p.id AND ml.author_id = sqlc.arg(viewer_id)
  ) AS liked_by_me,
  p.created_at
FROM posts p
JOIN users u ON u.id = p.author_id
LEFT JOIN likes l ON l.post_id = p.id
WHERE p.topic_id = sqlc.arg(topic_id)
GROUP BY p.id, u.display_name
ORDER BY like_count DESC, p.created_at DESC, p.id DESC
LIMIT ? OFFSET ?;

-- name: ListPostsByTopicNewest :many
SELECT
  p.id,
  p.author_id,
  p.title,
  LEFT(p.body, 200)   AS body_preview,
  CHAR_LENGTH(p.body) AS body_length,
  u.display_name AS author_name,
  COUNT(l.post_id) AS like_count,
  EXISTS (
    SELECT 1 FROM likes ml
    WHERE ml.post_id = p.id AND ml.author_id = sqlc.arg(viewer_id)
  ) AS liked_by_me,
  p.created_at
FROM posts p
JOIN users u ON u.id = p.author_id
LEFT JOIN likes l ON l.post_id = p.id
WHERE p.topic_id = sqlc.arg(topic_id)
GROUP BY p.id, u.display_name
ORDER BY p.created_at DESC, p.id DESC
LIMIT ? OFFSET ?;

-- name: ListPostsByTopicOldest :many
SELECT
  p.id,
  p.author_id,
  p.title,
  LEFT(p.body, 200)   AS body_preview,
  CHAR_LENGTH(p.body) AS body_length,
  u.display_name AS author_name,
  COUNT(l.post_id) AS like_count,
  EXISTS (
    SELECT 1 FROM likes ml
    WHERE ml.post_id = p.id AND ml.author_id = sqlc.arg(viewer_id)
  ) AS liked_by_me,
  p.created_at
FROM posts p
JOIN users u ON u.id = p.author_id
LEFT JOIN likes l ON l.post_id = p.id
WHERE p.topic_id = sqlc.arg(topic_id)
GROUP BY p.id, u.display_name
ORDER BY p.created_at ASC, p.id ASC
LIMIT ? OFFSET ?;

-- name: CreatePost :exec
INSERT INTO posts (id, topic_id, author_id, title, body, created_at)
VALUES (?, ?, ?, ?, ?, ?);

-- name: GetPostById :one
SELECT
  p.id,
  p.author_id,
  p.title,
  p.body,
  u.display_name AS author_name,
  COUNT(l.post_id) AS like_count,
  EXISTS (
    SELECT 1 FROM likes ml
    WHERE ml.post_id = p.id AND ml.author_id = sqlc.arg(viewer_id)
  ) AS liked_by_me,
  p.created_at,
  t.id   AS topic_id,
  t.slug AS topic_slug,
  t.name AS topic_name
FROM posts p
JOIN users u ON u.id = p.author_id
JOIN topics t ON t.id = p.topic_id
LEFT JOIN likes l ON l.post_id = p.id
WHERE p.id = sqlc.arg(post_id)
GROUP BY p.id, u.display_name, t.id, t.slug, t.name;

-- name: GetPostAuthor :one
SELECT author_id FROM posts WHERE id = ?;

-- name: DeletePost :execrows
DELETE FROM posts WHERE id = ? AND author_id = ?;
