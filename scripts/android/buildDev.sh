export ANDROID_HOME="/usr/lib/android-sdk"
export EAS_LOCAL_BUILD_ARTIFACTS_DIR=./builds
GOOGLE_SERVICES_JSON=$(realpath ./creds/google-services.json)
export GOOGLE_SERVICES_JSON
eas build -p android --profile development --local
# rename the latest modified file to dev.apk
find "$EAS_LOCAL_BUILD_ARTIFACTS_DIR" -name "*.apk" -sort -limit 1 -exec mv {} dev.apk \;