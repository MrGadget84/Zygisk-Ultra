#!/system/bin/sh

set -e

export TMP_PATH=/data/adb/zygiskultra
rm -rf "$TMP_PATH"

rm -f /data/adb/service.d/zygiskultra.sh

# INFO: Only removes if dir is empty
rmdir /data/adb/service.d

exit 0
