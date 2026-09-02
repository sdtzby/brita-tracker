# 💧 BRITA Style Essential XL - 150L Akıllı Su Takip PWA

İş yerinde kullanılan **BRITA Style Essential XL** su arıtma sürahisinin 150 litrelik filtre kapasitesini adım adım takip eden, mobil odaklı, PWA destekli, Firebase senkronizasyonlu ve GitHub Pages üzerinde çalışan modern web uygulaması.

---

## ✨ Özellikler

- 📱 **Mobil Öncelikli & Lüks Tasarım:** Derin lacivert ve parlayan neon aqua/cyan tonları, cam efektli (glassmorphism) modern kartlar.
- 🌊 **Canlı Sıvı Dalga Göstergesi:** Filtre doluluk oranını dairesel dalga animasyonuyla (Circular Liquid Wave) anlık gösterir.
- ⚡ **Hızlı Su Girişi Butonları:**
  - 🧊 **Brita XL Dolumu (+2.30 L)** (Sürahinin tam arıtılmış su haznesi)
  - 💧 **Bardak (+0.25 L)**
  - 🥤 **Matara / Şişe (+0.50 L)**
  - 🫖 **Kettle / Çaydanlık (+1.00 L)**
  - 🍶 **Büyük Şişe (+1.50 L)**
  - ➕ **Özel Miktar:** İstenen litreyi hassas kaydırıcı veya butonlarla girme imkanı.
- ↩️ **Son Girişi Geri Al (Undo):** Yanlışlıkla yapılan su eklemelerini anında geri alma.
- 📊 **Akıllı Filtre Ömrü & Tahmin:** Takılma tarihi, geçen gün sayısı, günlük ortalama tüketim ve filtrenin tahmini bitiş tarihi.
- 🔄 **Filtre Değişimi & Sıfırlama:** Yeni kartuş takıldığında sayacı 150 litreye sıfırlama.
- 📲 **PWA Desteği:** iOS ve Android cihazlarda "Ana Ekrana Ekle" özelliğiyle yerel uygulama gibi çevrimdışı ve tam ekran kullanım.
- 🔐 **Firebase Kimlik Doğrulama & Firestore:** E-posta/Şifre ile güvenli giriş ve birden fazla cihaz (telefon, iş bilgisayarı) arasında anlık senkronizasyon.

---

## 🚀 Yerel Geliştirme (Localhost)

Projeyi bilgisayarınızda çalıştırmak için:

```bash
# 1. Bağımlılıkları yükleyin (daha önce yüklendiyse atlayabilirsiniz)
npm install

# 2. Geliştirici sunucusunu başlatın
npm run dev
```

Tarayıcınızda `http://localhost:5173` adresine giderek uygulamayı görüntüleyebilirsiniz.

---

## 🔐 Firebase Kurulumu

Uygulama, Firebase yapılandırması girilmediğinde otomatik olarak **Lokal Demo Modunda** açılır. Tüm özellikleri hemen deneyebilirsiniz.

Firebase bulut senkronizasyonunu aktifleştirmek için:
1. [Firebase Console](https://console.firebase.google.com/) üzerinden yeni bir proje oluşturun.
2. **Authentication** menüsünden **Email/Password** sağlayıcısını aktifleştirin.
3. **Firestore Database** oluşturun (Test modunda başlatabilirsiniz).
4. Proje Ayarları > Web Uygulaması ekle adımlarını izleyip konfigürasyon bilgilerinizi alın (`apiKey`, `projectId`, `authDomain`, `appId`).
5. Uygulama içerisindeki **⚙️ Ayarlar** butonuna tıklayarak bu bilgileri yapıştırın ve "Kaydet" deyin. Artık verileriniz Google Cloud Firestore'a kaydedilecek ve telefonunuzla senkronize olacaktır!

---

## 🌐 GitHub Pages'de Yayınlama

Projede `.github/workflows/deploy.yml` otomatik dağıtım dosyası hazırdır:

1. Bu klasörde bir git deposu oluşturup GitHub'a push edin:
   ```bash
   git init
   git add .
   git commit -m "feat: initial brita tracker pwa"
   git branch -M main
   git remote add origin https://github.com/<kullanici-adiniz>/brita.git
   git push -u origin main
   ```
2. GitHub deponuzun **Settings > Pages** sekmesine gidin.
3. **Build and deployment > Source** kısmını **GitHub Actions** olarak seçin.
4. Birkaç dakika içinde siteniz `https://<kullanici-adiniz>.github.io/brita/` adresinde canlıya geçecektir!
