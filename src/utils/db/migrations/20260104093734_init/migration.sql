-- CreateTable
CREATE TABLE "test_data_url_capture" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "apiUrl" TEXT NOT NULL,
    "apiMethod" TEXT NOT NULL,
    "apiPostData" TEXT,
    "apiParams" TEXT,
    "apiRequestHeaders" TEXT,
    "apiResponseHeaders" TEXT,
    "apiResponseBody" TEXT,
    "apiStatusCode" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
