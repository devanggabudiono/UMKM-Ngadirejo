-- =============================================
-- UMKM Ngadirejo - Database Schema
-- Normalized, production-ready schema
-- =============================================

-- Tabel utama UMKM
CREATE TABLE IF NOT EXISTS umkm (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  nama VARCHAR(255) NOT NULL,
  pemilik VARCHAR(255) DEFAULT NULL,
  kategori VARCHAR(100) NOT NULL,
  deskripsi_singkat TEXT DEFAULT NULL,
  deskripsi_lengkap TEXT DEFAULT NULL,
  produk JSON DEFAULT NULL,
  alamat TEXT DEFAULT NULL,
  latitude DECIMAL(10, 8) DEFAULT NULL,
  longitude DECIMAL(11, 8) DEFAULT NULL,
  google_maps VARCHAR(500) DEFAULT NULL,
  whatsapp VARCHAR(30) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_slug (slug),
  INDEX idx_kategori (kategori),
  INDEX idx_coords (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Jam operasional per hari
CREATE TABLE IF NOT EXISTS operasional (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  umkm_id INT UNSIGNED NOT NULL,
  hari ENUM('senin','selasa','rabu','kamis','jumat','sabtu','minggu') NOT NULL,
  buka VARCHAR(10) DEFAULT '00:00',
  tutup VARCHAR(10) DEFAULT '00:00',
  libur BOOLEAN DEFAULT FALSE,

  UNIQUE KEY uk_umkm_hari (umkm_id, hari),
  FOREIGN KEY (umkm_id) REFERENCES umkm(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel tags
CREATE TABLE IF NOT EXISTS tags (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Junction table UMKM <-> Tags (many-to-many)
CREATE TABLE IF NOT EXISTS umkm_tags (
  umkm_id INT UNSIGNED NOT NULL,
  tag_id INT UNSIGNED NOT NULL,

  PRIMARY KEY (umkm_id, tag_id),
  FOREIGN KEY (umkm_id) REFERENCES umkm(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel gambar
CREATE TABLE IF NOT EXISTS images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  umkm_id INT UNSIGNED NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  is_cover BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,

  INDEX idx_umkm_cover (umkm_id, is_cover),
  FOREIGN KEY (umkm_id) REFERENCES umkm(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
