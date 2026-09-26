UPDATE topics
SET slug = 'recommended-resources', name = 'おすすめの教材'
WHERE id = 0x33333333333333333333333333333333;

INSERT INTO topics (id, slug, name, display_order) VALUES
  (0x44444444444444444444444444444444, 'anxiety-relief', '不安の解消法', 40),
  (0x55555555555555555555555555555555, 'keep-going', '続け方', 50);