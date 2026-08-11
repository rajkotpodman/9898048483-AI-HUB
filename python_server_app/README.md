# Secure Folder Share Server

A complete, production-ready Python desktop application with a graphical interface (GUI) that allows you to easily share a local folder or Google Drive path over the internet securely. It uses Python's native `http.server`, Cloudflare `cloudflared` Quick Tunnels for random HTTPS links, and runs persistently in the System Tray.

## Prerequisites

1. **Python 3.x**: Ensure Python is installed on your system.
2. **Cloudflare Tunnel (`cloudflared`)**: You can either install it globally or use portable mode:
   - **Portable Mode (Zero-Install)**: Simply download the `cloudflared` executable for your OS and place it in the same folder as `app.py` (or the compiled `.exe`). The app will automatically detect and use it.
   - **Global Install**: 
     - Windows: Download `cloudflared-windows-amd64.exe`, rename to `cloudflared.exe`, and add to PATH.
     - macOS: `brew install cloudflared`
     - Linux: `wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i cloudflared-linux-amd64.deb`

## Installation

1. Navigate to the directory containing this app:
   ```bash
   cd python_server_app
   ```

2. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the App

To run the application directly via Python:
```bash
python app.py
```

## Building Multi-OS Executables

To package this application into a standalone executable that doesn't require users to install Python or modules (they only need `cloudflared`), use PyInstaller.

### For Windows (.exe)
Run this command in Command Prompt or PowerShell:
```bash
pyinstaller --noconsole --onefile app.py
```
The compiled executable will be located at `dist/app.exe`.

### For macOS (.app / binary)
Run this command in your Terminal:
```bash
pyinstaller --noconsole --onefile app.py
```
The compiled application will be located in the `dist` folder. 

### For Linux
Run this command in your Terminal:
```bash
pyinstaller --noconsole --onefile app.py
```
The compiled binary will be located at `dist/app`.

## Features Overview

- **Folder Selection**: Pick any local path or mounted Google Drive folder to serve.
- **Random HTTPS Tunnels**: Quickly generates `https://something.trycloudflare.com` links.
- **Portable Mode**: No complex installation required; just place the `cloudflared` executable next to the app.
- **System Tray**: Minimizes to the taskbar/tray on close, keeping the server alive in the background.
