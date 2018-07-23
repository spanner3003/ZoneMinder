--
-- Add Plugins column to Monitors
--

SELECT 'Checking For Plugins in Monitors';
SET @s = (SELECT IF(
    (SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = 'Monitors'
    AND table_schema = DATABASE()
    AND column_name = 'Plugins'
    ) > 0,
"SELECT 'Column Plugins exists in Monitors'",
"ALTER TABLE Monitors ADD `Plugins` varchar(255) AFTER `ZoneCount`"
));

PREPARE stmt FROM @s;
EXECUTE stmt;

SELECT 'Checking For DoNativeMotionDetection in Monitors';
SET @s = (SELECT IF(
    (SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = 'Monitors'
    AND table_schema = DATABASE()
    AND column_name = 'DoNativeMotionDetection'
    ) > 0,
"SELECT 'Column DoNativeMotionDetection exists in Monitors'",
"ALTER TABLE Monitors ADD `DoNativeMotionDetection` BOOLEAN NOT NULL DEFAULT true AFTER `Plugins`"
));

PREPARE stmt FROM @s;
EXECUTE stmt;
