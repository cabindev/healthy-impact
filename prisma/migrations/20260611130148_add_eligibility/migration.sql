-- AlterTable
ALTER TABLE `Survey` ADD COLUMN `eligible` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `ineligibleReason` VARCHAR(191) NULL;
