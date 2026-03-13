-- AlterTable
ALTER TABLE `user` ADD COLUMN `isSuperAdmin` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `ChFiling` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `companyId` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL,
    `payloadJson` TEXT NOT NULL,
    `companyNumber` VARCHAR(191) NULL,
    `transactionId` VARCHAR(191) NULL,
    `env` VARCHAR(191) NOT NULL DEFAULT 'sandbox',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ChFiling_companyNumber_key`(`companyNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChFiling` ADD CONSTRAINT `ChFiling_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChFiling` ADD CONSTRAINT `ChFiling_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
