CREATE TABLE `SecurityRateLimit` (
    `key` VARCHAR(64) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NOT NULL,
    INDEX `SecurityRateLimit_expiresAt_idx` (`expiresAt`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
