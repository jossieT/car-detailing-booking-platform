/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "users_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
