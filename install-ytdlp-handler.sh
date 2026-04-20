#!/bin/bash

# 1. Define Paths
BIN_DIR="$HOME/.local/bin"
APP_DIR="$HOME/.local/share/applications"
HANDLER_PATH="$BIN_DIR/yt-dlp-handler.sh"
DESKTOP_FILE="$APP_DIR/yt-dlp-handler.desktop"

mkdir -p "$BIN_DIR"
mkdir -p "$APP_DIR"

# 2. Identify available terminal
if command -v gnome-terminal >/dev/null; then
    TERM_CMD="gnome-terminal -- bash -c"
elif command -v konsole >/dev/null; then
    TERM_CMD="konsole -e bash -c"
elif command -v xfce4-terminal >/dev/null; then
    TERM_CMD="xfce4-terminal -e"
elif command -v alacritty >/dev/null; then
    TERM_CMD="alacritty -e bash -c"
else
    TERM_CMD="xterm -e"
fi

# 3. Create the Handler Script (Updated with URL fix logic)
cat << EOF > "$HANDLER_PATH"
#!/bin/bash
# Trim the 'ytdl://' prefix
RAW_INPUT="\${1#ytdl://}"

# Fix the colon-stripping issue (e.g., https// -> https://)
URL=\$(echo "\$RAW_INPUT" | sed 's|^\(https*\)//|\1://|')

# Navigate to Downloads
cd "\$HOME/Downloads" || exit

# Run yt-dlp quietly without extra logging
$TERM_CMD "yt-dlp '\$URL'; echo; echo 'Download complete. Press Enter to close.'; read"
EOF

chmod +x "$HANDLER_PATH"

# 4. Create the .desktop Entry
cat << EOF > "$DESKTOP_FILE"
[Desktop Entry]
Name=yt-dlp Handler
Exec=$HANDLER_PATH %u
Type=Application
Terminal=false
MimeType=x-scheme-handler/ytdl;
NoDisplay=true
EOF

# 5. Register the Mime Type (Suppressing qtpaths warnings)
echo "Registering protocol handler..."
xdg-mime default yt-dlp-handler.desktop x-scheme-handler/ytdl 2>/dev/null

# 6. Update databases
if command -v update-desktop-database >/dev/null; then
    update-desktop-database "$APP_DIR" 2>/dev/null
fi

echo "-----------------------------------------------"
echo "Setup Complete!"
echo "The 'ytdl://' protocol is active and the URL-fix is applied."
echo "Test it: xdg-open ytdl://https://youtu.be/1O0yazhqaxs"
echo "-----------------------------------------------"
