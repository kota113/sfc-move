export ANDROID_HOME="/usr/lib/android-sdk"
export EAS_LOCAL_BUILD_ARTIFACTS_DIR=./builds
npx eas build -p android --profile production --local
exit
