/*
  Warnings:

  - A unique constraint covering the columns `[timestamp,assetName,interval]` on the table `candles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `interval` to the `candles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."candles" ADD COLUMN     "interval" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "candles_timestamp_assetName_interval_key" ON "public"."candles"("timestamp", "assetName", "interval");
