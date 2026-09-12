-- このファイルは生成物である。手で編集しないこと。
--
-- 各テーブルの「現在の」定義を一覧できるようにするためだけに置いている。
-- スキーマの正本はあくまで migrations/ の連番ファイルであり、
-- sqlc もコード生成にはそちらを読む（backend/sqlc.yaml）。
--
-- このファイルは実行できない。外部キーが後で定義されるテーブルを参照するため、
-- 上から流すと失敗する。読むためのものである。
--
-- 再生成:
--   docker compose exec -T db mysqldump -uroot -p<パスワード> \
--     --no-data --compact --ignore-table=mydb.schema_migrations mydb \
--     > backend/internal/database/schema.generated.sql
--
-- migrations/ に変更を入れたら、このファイルも必ず作り直すこと。

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `likes` (
  `post_id` binary(16) NOT NULL,
  `author_id` binary(16) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`post_id`,`author_id`),
  KEY `fk_likes_author` (`author_id`),
  CONSTRAINT `fk_likes_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_likes_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` binary(16) NOT NULL,
  `topic_id` binary(16) NOT NULL,
  `author_id` binary(16) NOT NULL,
  `title` varchar(100) NOT NULL,
  `body` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_posts_topic` (`topic_id`),
  KEY `fk_posts_author` (`author_id`),
  CONSTRAINT `fk_posts_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_posts_topic` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_posts_body` CHECK ((char_length(`body`) between 1 and 15000)),
  CONSTRAINT `chk_posts_title` CHECK ((char_length(`title`) between 1 and 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` char(64) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `user_id` binary(16) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_sessions_user` (`user_id`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_sessions_id` CHECK (regexp_like(`id`,_utf8mb4'^[a-f0-9]{64}$',_utf8mb4'c'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `topics` (
  `id` binary(16) NOT NULL,
  `slug` varchar(64) NOT NULL,
  `name` varchar(50) NOT NULL,
  `display_order` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  CONSTRAINT `chk_topics_name` CHECK ((char_length(`name`) between 1 and 50)),
  CONSTRAINT `chk_topics_slug` CHECK (regexp_like(`slug`,_utf8mb4'^[a-z0-9-]+$',_utf8mb4'c'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` binary(16) NOT NULL,
  `display_name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `email` varchar(254) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  CONSTRAINT `chk_users_display_name` CHECK ((char_length(`display_name`) between 1 and 50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
