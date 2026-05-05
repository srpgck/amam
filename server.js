const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 4000; // Çakışmaması için 4000 portunu kullanıyoruz

// JSON ve URL-encoded verileri okuyabilmek için limitleri artırdık (uzun metinler gelebilir)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Statik dosyaları (HTML/CSS) sunmak için
app.use(express.static(path.join(__dirname, 'public')));

// Veritabanı klasör yolları
const DB_DIR = path.join(__dirname, 'database');
const JSON_DIR = path.join(DB_DIR, 'klinik_kodlar');
const SUMMARY_DIR = path.join(DB_DIR, 'rag_ozetler');

// Başlangıçta klasörlerin var olduğundan emin olalım
async function initFolders() {
    try {
        await fs.mkdir(DB_DIR, { recursive: true });
        await fs.mkdir(JSON_DIR, { recursive: true });
        await fs.mkdir(SUMMARY_DIR, { recursive: true });
        console.log("📁 Veritabanı klasörleri hazırlandı.");
    } catch (err) {
        console.error("Klasör oluşturma hatası:", err);
    }
}
initFolders();

// --- VERİ KAYDETME API'Sİ ---
app.post('/api/kaydet', async (req, res) => {
    try {
        const { bookName, jsonData, textSummary } = req.body;

        if (!bookName) {
            return res.status(400).json({ success: false, message: "Kitap/Modül adı zorunludur!" });
        }

        // Dosya ismi için Türkçe karakterleri ve boşlukları temizle
        const safeFileName = bookName.toLowerCase()
            .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
            .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
            .replace(/[^a-z0-9]/g, '_');

        // 1. Kodu (JSON/JS) kaydet
        if (jsonData && jsonData.trim() !== '') {
            const jsonPath = path.join(JSON_DIR, `${safeFileName}.js`);
            await fs.writeFile(jsonPath, jsonData, 'utf8');
        }

        // 2. Düz Metin Özeti (RAG için) kaydet
        if (textSummary && textSummary.trim() !== '') {
            const summaryPath = path.join(SUMMARY_DIR, `${safeFileName}.md`);
            await fs.writeFile(summaryPath, textSummary, 'utf8');
        }

        res.json({ success: true, message: `${bookName} başarıyla sisteme kaydedildi!` });

    } catch (error) {
        console.error("Kaydetme hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası oluştu." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Veri Giriş Paneli Çalışıyor: http://localhost:${PORT}`);
});