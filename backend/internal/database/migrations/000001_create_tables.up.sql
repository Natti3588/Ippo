CREATE TABLE topics (
  id            BINARY(16) NOT NULL PRIMARY KEY,
  slug          VARCHAR(64) NOT NULL UNIQUE,
  name          VARCHAR(50) NOT NULL,
  display_order INT NOT NULL,
  CONSTRAINT chk_topics_slug CHECK (REGEXP_LIKE(slug, '^[a-z0-9-]+$', 'c')),
  CONSTRAINT chk_topics_name CHECK (CHAR_LENGTH(name) BETWEEN 1 AND 50)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE users (
  id           BINARY(16) NOT NULL PRIMARY KEY,
  display_name VARCHAR(50) NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_users_display_name CHECK (CHAR_LENGTH(display_name) BETWEEN 1 AND 50)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE posts (
  id         BINARY(16) NOT NULL PRIMARY KEY,
  topic_id   BINARY(16) NOT NULL,
  author_id  BINARY(16) NOT NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_posts_topic  FOREIGN KEY (topic_id)  REFERENCES topics(id) ON DELETE CASCADE,
  CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT chk_posts_body CHECK (CHAR_LENGTH(body) BETWEEN 1 AND 1000)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE likes (
  post_id    BINARY(16) NOT NULL,
  author_id  BINARY(16) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, author_id),
  CONSTRAINT fk_likes_post   FOREIGN KEY (post_id)   REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
