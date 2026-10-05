-- CreateEnum
CREATE TYPE "OperatorRole" AS ENUM ('OWNER', 'EMPLOYEE');

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "photo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operators" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "OperatorRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balances" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "competence" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entries" (
    "id" TEXT NOT NULL,
    "balanceId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "amountInCents" INTEGER NOT NULL,
    "observation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "balanceId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "expenseCategoryId" TEXT NOT NULL,
    "amountInCents" INTEGER NOT NULL,
    "observation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_tags" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_method_payment_tags" (
    "paymentMethodId" TEXT NOT NULL,
    "paymentTagId" TEXT NOT NULL,

    CONSTRAINT "payment_method_payment_tags_pkey" PRIMARY KEY ("paymentMethodId","paymentTagId")
);

-- CreateIndex
CREATE INDEX "operators_restaurantId_idx" ON "operators"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "operators_restaurantId_email_key" ON "operators"("restaurantId", "email");

-- CreateIndex
CREATE INDEX "balances_restaurantId_competence_idx" ON "balances"("restaurantId", "competence");

-- CreateIndex
CREATE UNIQUE INDEX "balances_restaurantId_competence_key" ON "balances"("restaurantId", "competence");

-- CreateIndex
CREATE INDEX "entries_balanceId_idx" ON "entries"("balanceId");

-- CreateIndex
CREATE INDEX "entries_paymentMethodId_idx" ON "entries"("paymentMethodId");

-- CreateIndex
CREATE INDEX "expenses_balanceId_idx" ON "expenses"("balanceId");

-- CreateIndex
CREATE INDEX "expenses_expenseCategoryId_idx" ON "expenses"("expenseCategoryId");

-- CreateIndex
CREATE INDEX "payment_methods_restaurantId_idx" ON "payment_methods"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_restaurantId_name_key" ON "payment_methods"("restaurantId", "name");

-- CreateIndex
CREATE INDEX "expense_categories_restaurantId_idx" ON "expense_categories"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_restaurantId_name_key" ON "expense_categories"("restaurantId", "name");

-- CreateIndex
CREATE INDEX "payment_tags_restaurantId_idx" ON "payment_tags"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_tags_restaurantId_name_key" ON "payment_tags"("restaurantId", "name");

-- AddForeignKey
ALTER TABLE "operators" ADD CONSTRAINT "operators_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balances" ADD CONSTRAINT "balances_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES "balances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES "balances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_expenseCategoryId_fkey" FOREIGN KEY ("expenseCategoryId") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_tags" ADD CONSTRAINT "payment_tags_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_method_payment_tags" ADD CONSTRAINT "payment_method_payment_tags_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_method_payment_tags" ADD CONSTRAINT "payment_method_payment_tags_paymentTagId_fkey" FOREIGN KEY ("paymentTagId") REFERENCES "payment_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
