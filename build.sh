#!/bin/bash
set -euo pipefail

APP_NAME="Bóveda"
APP_EXECUTABLE="Boveda"
APP_ID="com.boveda.app"
APP_VERSION="1.0.0"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ELECTRON_DIR="$PROJECT_DIR/node_modules/electron/dist"
OUTPUT_DIR="$PROJECT_DIR/dist-new"

echo "=== Building $APP_NAME v$APP_VERSION ==="

# Clean output
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# Copy Electron.app
echo "Copying Electron framework..."
cp -R "$ELECTRON_DIR/Electron.app" "$OUTPUT_DIR/$APP_NAME.app"

# Remove default_app.asar
rm -f "$OUTPUT_DIR/$APP_NAME.app/Contents/Resources/default_app.asar"

# Set up app files
echo "Setting up app files..."
APP_DIR="$OUTPUT_DIR/$APP_NAME.app/Contents/Resources/app"
mkdir -p "$APP_DIR/src"
mkdir -p "$APP_DIR/assets"

cp "$PROJECT_DIR/main.js" "$APP_DIR/"
cp "$PROJECT_DIR/preload.js" "$APP_DIR/"
cat > "$APP_DIR/package.json" << EOF
{"name":"boveda","main":"main.js"}
EOF

cp "$PROJECT_DIR/src/"*.js "$APP_DIR/src/" 2>/dev/null || true
cp "$PROJECT_DIR/src/"*.html "$APP_DIR/src/" 2>/dev/null || true
cp "$PROJECT_DIR/src/"*.css "$APP_DIR/src/" 2>/dev/null || true
cp "$PROJECT_DIR/assets/"* "$APP_DIR/assets/" 2>/dev/null || true

# Copy Supabase node_modules (needed for database.js)
mkdir -p "$APP_DIR/node_modules/@supabase"
cp -R "$PROJECT_DIR/node_modules/@supabase" "$APP_DIR/node_modules/"
cp -R "$PROJECT_DIR/node_modules/tslib" "$APP_DIR/node_modules/" 2>/dev/null || true
cp -R "$PROJECT_DIR/node_modules/iceberg-js" "$APP_DIR/node_modules/" 2>/dev/null || true

# Seed file
cp "$PROJECT_DIR/resources/contrasenas.json" "$OUTPUT_DIR/$APP_NAME.app/Contents/Resources/"

# Icon
cp "$PROJECT_DIR/assets/icon.icns" "$OUTPUT_DIR/$APP_NAME.app/Contents/Resources/"

# Update Info.plist
PLIST="$OUTPUT_DIR/$APP_NAME.app/Contents/Info.plist"
plutil -replace CFBundleDisplayName -string "$APP_NAME" "$PLIST"
plutil -replace CFBundleName -string "$APP_EXECUTABLE" "$PLIST"
plutil -replace CFBundleExecutable -string "$APP_EXECUTABLE" "$PLIST"
plutil -replace CFBundleIdentifier -string "$APP_ID" "$PLIST"
plutil -replace CFBundleShortVersionString -string "$APP_VERSION" "$PLIST"
plutil -replace CFBundleIconFile -string "icon.icns" "$PLIST"
plutil -replace LSApplicationCategoryType -string "public.app-category.utilities" "$PLIST"
# Remove ElectronAsarIntegrity (we removed default_app.asar)
plutil -remove ElectronAsarIntegrity "$PLIST" 2>/dev/null || true

# Rename main executable
mv "$OUTPUT_DIR/$APP_NAME.app/Contents/MacOS/Electron" "$OUTPUT_DIR/$APP_NAME.app/Contents/MacOS/$APP_EXECUTABLE"

# Rename helper apps
for old_name in "Electron Helper" "Electron Helper (GPU)" "Electron Helper (Renderer)" "Electron Helper (Plugin)"; do
  new_name="Boveda Helper${old_name#Electron Helper}"
  display_name="$APP_NAME Helper${old_name#Electron Helper}"
  old_path="$OUTPUT_DIR/$APP_NAME.app/Contents/Frameworks/${old_name}.app"
  new_path="$OUTPUT_DIR/$APP_NAME.app/Contents/Frameworks/${new_name}.app"
  if [ -d "$old_path" ]; then
    plutil -replace CFBundleDisplayName -string "$display_name" "$old_path/Contents/Info.plist"
    plutil -replace CFBundleName -string "$new_name" "$old_path/Contents/Info.plist"
    plutil -replace CFBundleExecutable -string "$new_name" "$old_path/Contents/Info.plist"
    if [ -f "$old_path/Contents/MacOS/$old_name" ]; then
      mv "$old_path/Contents/MacOS/$old_name" "$old_path/Contents/MacOS/$new_name"
    fi
    mv "$old_path" "$new_path"
  fi
done

# Code sign
echo "Code signing..."
codesign -f -s - "$OUTPUT_DIR/$APP_NAME.app/Contents/MacOS/$APP_EXECUTABLE" 2>&1
codesign -f -s - "$OUTPUT_DIR/$APP_NAME.app/Contents/Frameworks/Electron Framework.framework" 2>&1
for fwk in Squirrel Mantle ReactiveObjC; do
  codesign -f -s - "$OUTPUT_DIR/$APP_NAME.app/Contents/Frameworks/${fwk}.framework" 2>&1
done
for helper in "Boveda Helper.app" "Boveda Helper (GPU).app" "Boveda Helper (Renderer).app" "Boveda Helper (Plugin).app"; do
  helper_exec="${helper%.app}"
  codesign -f -s - "$OUTPUT_DIR/$APP_NAME.app/Contents/Frameworks/${helper}/Contents/MacOS/${helper_exec}" 2>&1
  codesign -f -s - "$OUTPUT_DIR/$APP_NAME.app/Contents/Frameworks/${helper}" 2>&1
done
codesign -f -s - "$OUTPUT_DIR/$APP_NAME.app" 2>&1

echo ""
echo "=== App built successfully ==="
du -sh "$OUTPUT_DIR/$APP_NAME.app"

# Create DMG
echo ""
echo "Creating DMG..."
STAGING=$(mktemp -d)
cp -R "$OUTPUT_DIR/$APP_NAME.app" "$STAGING/"
ln -s /Applications "$STAGING/Applications"
hdiutil create -volname "$APP_NAME" -srcfolder "$STAGING" -ov -format UDZO "$OUTPUT_DIR/$APP_NAME.dmg" 2>&1
rm -rf "$STAGING"

echo ""
echo "=== DMG created ==="
ls -lh "$OUTPUT_DIR/$APP_NAME.dmg"
echo ""
echo "Output: $OUTPUT_DIR/"
