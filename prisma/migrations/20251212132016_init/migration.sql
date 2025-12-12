-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'SATPAM') NOT NULL DEFAULT 'SATPAM',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DataTempat` (
    `id` VARCHAR(191) NOT NULL,
    `namaLokasi` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `radius` INTEGER NOT NULL DEFAULT 5,
    `urutan` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DataTempat_urutan_key`(`urutan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Shift` (
    `id` VARCHAR(191) NOT NULL,
    `namaShift` VARCHAR(191) NOT NULL,
    `jamMulai` VARCHAR(191) NOT NULL,
    `jamSelesai` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HistoryPatroli` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `shiftId` VARCHAR(191) NOT NULL,
    `tanggal` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `durasi` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ONGOING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PatrolCheckpoint` (
    `id` VARCHAR(191) NOT NULL,
    `historyPatroliId` VARCHAR(191) NOT NULL,
    `dataTempatId` VARCHAR(191) NOT NULL,
    `waktuCheck` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PatrolCheckpoint_historyPatroliId_dataTempatId_key`(`historyPatroliId`, `dataTempatId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HistoryPatroli` ADD CONSTRAINT `HistoryPatroli_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HistoryPatroli` ADD CONSTRAINT `HistoryPatroli_shiftId_fkey` FOREIGN KEY (`shiftId`) REFERENCES `Shift`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PatrolCheckpoint` ADD CONSTRAINT `PatrolCheckpoint_historyPatroliId_fkey` FOREIGN KEY (`historyPatroliId`) REFERENCES `HistoryPatroli`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PatrolCheckpoint` ADD CONSTRAINT `PatrolCheckpoint_dataTempatId_fkey` FOREIGN KEY (`dataTempatId`) REFERENCES `DataTempat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
