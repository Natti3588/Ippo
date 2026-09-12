-- 上限を狭める down なので、1000文字を超える行があれば必ず失敗する。
-- 失敗するのは避けられないが、「途中まで適用してから失敗する」のは避けられる。
--
-- MySQL の DDL は文ごとに暗黙コミットされ、golang-migrate もトランザクションで
-- 包まない。そのため DROP を先に書くと、制約が消えた状態で止まる。
-- 別名で足して試し、成功してから入れ替える。

-- 1. データが条件を満たすかを、何も壊さずに試す。
--    1000文字を超える行があるとここで失敗し、テーブルは無変更のままになる。
ALTER TABLE posts
  ADD CONSTRAINT chk_posts_body_probe CHECK (CHAR_LENGTH(body) BETWEEN 1 AND 1000);

-- 2. ここから先は、全行が1000文字以内であることが保証されている。
ALTER TABLE posts DROP CHECK chk_posts_body;

-- 3. 000001 と同じ名前で貼り直す。2 で probe が残っているので、
--    この間も 1000 文字の制約は効き続けている。
ALTER TABLE posts
  ADD CONSTRAINT chk_posts_body CHECK (CHAR_LENGTH(body) BETWEEN 1 AND 1000);

-- 4. 足場を外す。
ALTER TABLE posts DROP CHECK chk_posts_body_probe;
