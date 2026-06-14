-- CreateTable
CREATE TABLE "tb_kecamatan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kode_kec" TEXT NOT NULL,
    "nama_kec" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "tb_desa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_kecamatan" INTEGER NOT NULL,
    "id_desa" TEXT NOT NULL,
    "kode_desa" TEXT NOT NULL,
    "nama_desa" TEXT NOT NULL,
    CONSTRAINT "tb_desa_id_kecamatan_fkey" FOREIGN KEY ("id_kecamatan") REFERENCES "tb_kecamatan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tb_sls" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_desa" INTEGER NOT NULL,
    "kode_sls" TEXT NOT NULL,
    "nama_sls" TEXT NOT NULL,
    CONSTRAINT "tb_sls_id_desa_fkey" FOREIGN KEY ("id_desa") REFERENCES "tb_desa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tb_subsls" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_sls" INTEGER NOT NULL,
    "kode_subsls" TEXT NOT NULL,
    "id_subsls" TEXT NOT NULL,
    "id_subsls_2025" TEXT,
    "nama_korlap" TEXT NOT NULL,
    "nama_pml" TEXT NOT NULL,
    "nama_pcl" TEXT NOT NULL,
    "total_muatan_assignment" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "tb_subsls_id_sls_fkey" FOREIGN KEY ("id_sls") REFERENCES "tb_sls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tb_user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'pcl',
    "id_kecamatan" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tb_user_id_kecamatan_fkey" FOREIGN KEY ("id_kecamatan") REFERENCES "tb_kecamatan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tb_tugas_pcl" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_user" INTEGER NOT NULL,
    "id_subsls" INTEGER NOT NULL,
    CONSTRAINT "tb_tugas_pcl_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "tb_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tb_tugas_pcl_id_subsls_fkey" FOREIGN KEY ("id_subsls") REFERENCES "tb_subsls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tb_laporan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tanggal" DATETIME NOT NULL,
    "id_subsls" INTEGER NOT NULL,
    "jumlah_assignment" INTEGER NOT NULL DEFAULT 0,
    "jumlah_selesai" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'progres',
    "keterangan" TEXT,
    "id_user" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tb_laporan_id_subsls_fkey" FOREIGN KEY ("id_subsls") REFERENCES "tb_subsls" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tb_laporan_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "tb_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tb_target" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_kecamatan" INTEGER NOT NULL,
    "target_selesai_persen" REAL NOT NULL DEFAULT 100.0,
    "tanggal_mulai" DATETIME NOT NULL,
    "tanggal_selesai" DATETIME NOT NULL,
    CONSTRAINT "tb_target_id_kecamatan_fkey" FOREIGN KEY ("id_kecamatan") REFERENCES "tb_kecamatan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "tb_kecamatan_kode_kec_key" ON "tb_kecamatan"("kode_kec");

-- CreateIndex
CREATE UNIQUE INDEX "tb_desa_id_desa_key" ON "tb_desa"("id_desa");

-- CreateIndex
CREATE UNIQUE INDEX "tb_subsls_id_subsls_key" ON "tb_subsls"("id_subsls");

-- CreateIndex
CREATE UNIQUE INDEX "tb_user_username_key" ON "tb_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "tb_tugas_pcl_id_user_id_subsls_key" ON "tb_tugas_pcl"("id_user", "id_subsls");

-- CreateIndex
CREATE UNIQUE INDEX "tb_laporan_tanggal_id_subsls_key" ON "tb_laporan"("tanggal", "id_subsls");
