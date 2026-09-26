DELETE FROM topics WHERE slug IN ('anxiety-relief', 'keep-going');

UPDATE topics
SET slug = 'free-resources', name = '無料の教材'
WHERE id = 0x33333333333333333333333333333333;
