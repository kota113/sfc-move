export ANDROID_HOME="/usr/lib/android-sdk"
export EAS_LOCAL_BUILD_ARTIFACTS_DIR=./builds
GOOGLE_SERVICES_JSON=$(realpath ./creds/google-services.json)
export GOOGLE_SERVICES_JSON
npx eas build -p android --profile preview --local
exit