# Build Android App

## Prerequisites

- Node.js 18+
- Android Studio
- JDK 17+

## Build Steps

### 1. Build Next.js

```bash
npm run build
```

### 2. Sync Capacitor

```bash
npx cap sync android
```

### 3. Open Android Studio

```bash
npx cap open android
```

### 4. Build APK

Di Android Studio:

- Build > Build Bundle(s) / APK(s) > Build APK(s)
- APK akan tersimpan di: `android/app/build/outputs/apk/debug/app-debug.apk`

## Quick Build

```bash
npm run android
```

## Build Release APK

1. Generate keystore:

```bash
keytool -genkey -v -keystore ceritain-release.keystore -alias ceritain -keyalg RSA -keysize 2048 -validity 10000
```

2. Edit `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('../../ceritain-release.keystore')
            storePassword 'your-password'
            keyAlias 'ceritain'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

3. Build:

```bash
cd android
./gradlew assembleRelease
```

APK: `android/app/build/outputs/apk/release/app-release.apk`

## Install ke Device

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Permissions

App memerlukan:

- INTERNET
- RECORD_AUDIO
- MODIFY_AUDIO_SETTINGS
- ACCESS_NETWORK_STATE

Sudah dikonfigurasi di `AndroidManifest.xml`
