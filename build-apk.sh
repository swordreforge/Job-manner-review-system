#!/bin/bash
set -e

cd "$(dirname "$0")/high-school-worker-design-forend"

echo "=== Building Rust libs for all Android targets ==="

export ANDROID_NDK_HOME=/opt/android-ndk

export CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER=$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/aarch64-linux-android21-clang
export CARGO_TARGET_ARMV7_LINUX_ANDROIDEABI_LINKER=$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/armv7a-linux-androideabi21-clang
export CARGO_TARGET_I686_LINUX_ANDROID_LINKER=$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/i686-linux-android21-clang
export CARGO_TARGET_X86_64_LINUX_ANDROID_LINKER=$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/x86_64-linux-android21-clang

cd src-tauri
cargo build --target aarch64-linux-android --release
cargo build --target armv7-linux-androideabi --release
cargo build --target i686-linux-android --release
cargo build --target x86_64-linux-android --release
cd ..

echo "=== Copying .so files to jniLibs ==="

rm -rf src-tauri/gen/android/app/src/main/jniLibs/*
mkdir -p src-tauri/gen/android/app/src/main/jniLibs/{arm64-v8a,armeabi-v7a,x86,x86_64}

cp src-tauri/target/aarch64-linux-android/release/libapp_lib.so src-tauri/gen/android/app/src/main/jniLibs/arm64-v8a/
cp src-tauri/target/armv7-linux-androideabi/release/libapp_lib.so src-tauri/gen/android/app/src/main/jniLibs/armeabi-v7a/
cp src-tauri/target/i686-linux-android/release/libapp_lib.so src-tauri/gen/android/app/src/main/jniLibs/x86/
cp src-tauri/target/x86_64-linux-android/release/libapp_lib.so src-tauri/gen/android/app/src/main/jniLibs/x86_64/

echo "=== Building Android APK ==="

export JAVA_HOME=/usr/lib/jvm/default
export ANDROID_HOME=$HOME/android-sdk
export ANDROID_SDK_ROOT=$HOME/android-sdk

cd src-tauri/gen/android
./gradlew :app:assembleUniversalRelease -x rustBuildUniversalRelease

cp app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk /home/swordreforge/projects/high-school-worker-design/high-school-worker-design-forend/app-universal-release-unsigned.apk

cd /home/swordreforge/projects/high-school-worker-design
ls -lh high-school-worker-design-forend/app-universal-release-unsigned.apk

echo "=== Done! APK at: app-universal-release-unsigned.apk ==="