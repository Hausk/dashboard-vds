-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "is2FAEnabled" BOOLEAN NOT NULL DEFAULT false,
    "is2FAVerified" BOOLEAN NOT NULL DEFAULT false,
    "twoFAMethod" TEXT,
    "twoFASecret" TEXT,
    "phoneNumber" TEXT,
    "lastVerified" DATETIME
);
INSERT INTO "new_User" ("email", "id", "is2FAEnabled", "password", "phoneNumber", "twoFAMethod", "twoFASecret") SELECT "email", "id", "is2FAEnabled", "password", "phoneNumber", "twoFAMethod", "twoFASecret" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
