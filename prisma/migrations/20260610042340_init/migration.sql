-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NULL,
    `role` ENUM('MEMBER', 'ADMIN', 'SUPERADMIN') NOT NULL DEFAULT 'MEMBER',
    `province` VARCHAR(191) NULL,
    `amphoe` VARCHAR(191) NULL,
    `district` VARCHAR(191) NULL,
    `zone` VARCHAR(191) NULL,
    `emailVerified` DATETIME(3) NULL,
    `resetToken` VARCHAR(191) NULL,
    `resetTokenCreatedAt` DATETIME(3) NULL,
    `resetTokenExpiresAt` DATETIME(3) NULL,
    `lastPasswordReset` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_resetToken_key`(`resetToken`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Survey` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `questionnaireNo` VARCHAR(191) NULL,
    `verifierName` VARCHAR(191) NULL,
    `verifierPhone` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `collectorName` VARCHAR(191) NULL,
    `collectorPhone` VARCHAR(191) NULL,
    `collectedAt` DATETIME(3) NULL,
    `siteType` ENUM('VILLAGE', 'WORKPLACE', 'SCHOOL') NOT NULL DEFAULT 'VILLAGE',
    `villageNo` VARCHAR(191) NULL,
    `villageName` VARCHAR(191) NULL,
    `province` VARCHAR(191) NULL,
    `amphoe` VARCHAR(191) NULL,
    `tambon` VARCHAR(191) NULL,
    `residence6Months` BOOLEAN NULL,
    `consentGiven` BOOLEAN NOT NULL DEFAULT false,
    `consentAt` DATETIME(3) NULL,
    `nationalId` VARCHAR(191) NULL,
    `prefix` VARCHAR(191) NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `gender` VARCHAR(191) NULL,
    `genderOther` VARCHAR(191) NULL,
    `birthDate` VARCHAR(191) NULL,
    `religion` VARCHAR(191) NULL,
    `religionOther` VARCHAR(191) NULL,
    `rights` TEXT NULL,
    `weightKg` DECIMAL(5, 2) NULL,
    `heightCm` DECIMAL(5, 2) NULL,
    `waistCm` DECIMAL(6, 2) NULL,
    `diseases` TEXT NULL,
    `diseaseOther` VARCHAR(191) NULL,
    `eduStatus` VARCHAR(191) NULL,
    `eduLevel` VARCHAR(191) NULL,
    `ddDroveAfterDrink` VARCHAR(191) NULL,
    `ddInjured` VARCHAR(191) NULL,
    `creatorId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Survey_province_idx`(`province`),
    INDEX `Survey_amphoe_idx`(`amphoe`),
    INDEX `Survey_tambon_idx`(`tambon`),
    INDEX `Survey_siteType_idx`(`siteType`),
    INDEX `Survey_creatorId_idx`(`creatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SurveyTobacco` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `surveyId` INTEGER NOT NULL,
    `homeSmoking` VARCHAR(191) NULL,
    `smokeStatus` VARCHAR(191) NULL,
    `everFactory` BOOLEAN NULL,
    `everRolled` BOOLEAN NULL,
    `everEcig` BOOLEAN NULL,
    `everSmokeless` BOOLEAN NULL,
    `everOther` BOOLEAN NULL,
    `curFactory` BOOLEAN NULL,
    `curFactoryAmt` INTEGER NULL,
    `curRolled` BOOLEAN NULL,
    `curRolledAmt` INTEGER NULL,
    `curEcig` BOOLEAN NULL,
    `curEcigAmt` INTEGER NULL,
    `curSmokeless` BOOLEAN NULL,
    `curSmokelessAmt` INTEGER NULL,
    `curOther` BOOLEAN NULL,
    `curOtherAmt` INTEGER NULL,
    `firstCigTime` VARCHAR(191) NULL,
    `quitAttempt` VARCHAR(191) NULL,

    UNIQUE INDEX `SurveyTobacco_surveyId_key`(`surveyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SurveyAlcohol` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `surveyId` INTEGER NOT NULL,
    `q1Frequency` INTEGER NULL,
    `beerDrink` BOOLEAN NULL,
    `beerAmt` INTEGER NULL,
    `liquorDrink` BOOLEAN NULL,
    `liquorAmt` INTEGER NULL,
    `wineDrink` BOOLEAN NULL,
    `wineAmt` INTEGER NULL,
    `q3Binge` INTEGER NULL,
    `q4CannotStop` INTEGER NULL,
    `q5FailNormal` INTEGER NULL,
    `q6Morning` INTEGER NULL,
    `q7Guilt` INTEGER NULL,
    `q8Blackout` INTEGER NULL,
    `q9Injury` INTEGER NULL,
    `q10Advised` INTEGER NULL,
    `auditScore` INTEGER NULL,
    `riskLevel` VARCHAR(191) NULL,

    UNIQUE INDEX `SurveyAlcohol_surveyId_key`(`surveyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Survey` ADD CONSTRAINT `Survey_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SurveyTobacco` ADD CONSTRAINT `SurveyTobacco_surveyId_fkey` FOREIGN KEY (`surveyId`) REFERENCES `Survey`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SurveyAlcohol` ADD CONSTRAINT `SurveyAlcohol_surveyId_fkey` FOREIGN KEY (`surveyId`) REFERENCES `Survey`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
