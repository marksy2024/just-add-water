-- CreateTable
CREATE TABLE "food_allocations" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "paddle_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "food_allocations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "food_allocations_paddle_id_user_id_category_key" UNIQUE ("paddle_id", "user_id", "category"),
    CONSTRAINT "food_allocations_paddle_id_fkey" FOREIGN KEY ("paddle_id") REFERENCES "paddles"("id") ON DELETE CASCADE,
    CONSTRAINT "food_allocations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
