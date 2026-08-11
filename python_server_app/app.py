import os
import sys
import time
import subprocess
import threading
import json
import tkinter as tk
from tkinter import filedialog, messagebox
from http.server import SimpleHTTPRequestHandler, HTTPServer

# Import third-party modules safely
try:
    import pystray
    from PIL import Image, ImageDraw
except ImportError:
    messagebox.showerror("Missing Dependencies", "Please install required packages:\npip install pystray pillow")
    sys.exit(1)

CONFIG_FILE = "server_config.json"
PORT = 8000

class FileServerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Secure Folder Share Server")
        self.root.geometry("550x450")
        self.root.resizable(False, False)
        
        self.httpd = None
        self.server_thread = None
        self.tunnel_process = None
        self.current_url = ""
        self.folder_path = self.load_config()
        self.is_shutting_down = False

        self.setup_gui()
        
        # Intercept Close Window -> Minimize to Tray
        self.root.protocol('WM_DELETE_WINDOW', self.hide_to_tray)
        
        # Auto prompt folder setup if first time
        if not self.folder_path:
            self.root.after(500, self.select_folder)

    def setup_gui(self):
        # Title
        tk.Label(self.root, text="Folder Sharing Server", font=("Arial", 18, "bold")).pack(pady=15)
        
        # Folder Selection Frame
        frame_folder = tk.Frame(self.root)
        frame_folder.pack(pady=10, fill="x", padx=20)
        
        self.lbl_folder = tk.Label(frame_folder, text=f"Folder: {self.folder_path or 'Not Selected'}", 
                                   wraplength=400, justify="left", fg="#333333")
        self.lbl_folder.pack(side="left", fill="x", expand=True)
        
        btn_browse = tk.Button(frame_folder, text="Browse", command=self.select_folder, width=10)
        btn_browse.pack(side="right", padx=5)

        # URL Display
        tk.Label(self.root, text="Live Random HTTPS Link:", font=("Arial", 11, "bold")).pack(pady=(15, 5))
        
        frame_url = tk.Frame(self.root)
        frame_url.pack(pady=5, padx=20, fill="x")
        
        self.entry_url = tk.Entry(frame_url, font=("Arial", 11), state="readonly")
        self.entry_url.pack(side="left", fill="x", expand=True, ipady=4)
        
        self.btn_copy = tk.Button(frame_url, text="Copy", command=self.copy_url, state="disabled")
        self.btn_copy.pack(side="right", padx=(5, 0))

        # Status Label
        self.lbl_status = tk.Label(self.root, text="Status: OFFLINE", fg="red", font=("Arial", 12, "bold"))
        self.lbl_status.pack(pady=15)

        # Buttons Frame
        frame_btn = tk.Frame(self.root)
        frame_btn.pack(pady=20)
        
        self.btn_start = tk.Button(frame_btn, text="Start Server", bg="#4CAF50", fg="white", 
                                   font=("Arial", 11, "bold"), width=13, command=self.start_server)
        self.btn_start.grid(row=0, column=0, padx=10)

        self.btn_refresh = tk.Button(frame_btn, text="Refresh Link", bg="#2196F3", fg="white", 
                                     font=("Arial", 11, "bold"), width=13, command=self.refresh_link, state="disabled")
        self.btn_refresh.grid(row=0, column=1, padx=10)

        self.btn_stop = tk.Button(frame_btn, text="Shutdown", bg="#F44336", fg="white", 
                                  font=("Arial", 11, "bold"), width=13, command=self.shutdown_server, state="disabled")
        self.btn_stop.grid(row=0, column=2, padx=10)

    def load_config(self):
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, "r") as f:
                    return json.load(f).get("folder_path", "")
            except:
                pass
        return ""

    def save_config(self, path):
        try:
            with open(CONFIG_FILE, "w") as f:
                json.dump({"folder_path": path}, f)
        except Exception as e:
            print(f"Failed to save config: {e}")

    def select_folder(self):
        selected = filedialog.askdirectory(title="Select Folder to Share")
        if selected:
            self.folder_path = selected
            self.save_config(selected)
            self.lbl_folder.config(text=f"Folder: {selected}")

    def copy_url(self):
        if self.current_url:
            self.root.clipboard_clear()
            self.root.clipboard_append(self.current_url)
            messagebox.showinfo("Copied", "Link copied to clipboard!")

    def run_http_server(self):
        try:
            os.chdir(self.folder_path)
            handler = SimpleHTTPRequestHandler
            # Use SO_REUSEADDR so we don't get "Address already in use" on fast restarts
            HTTPServer.allow_reuse_address = True
            self.httpd = HTTPServer(('127.0.0.1', PORT), handler)
            print(f"Serving HTTP on port {PORT}...")
            self.httpd.serve_forever()
        except Exception as e:
            if not self.is_shutting_down:
                print(f"HTTP Server error: {e}")
                self.root.after(0, lambda: messagebox.showerror("Server Error", str(e)))

    def get_cloudflared_path(self):
        # Check current working directory first
        exe_name = "cloudflared.exe" if os.name == "nt" else "cloudflared"
        local_path = os.path.join(os.getcwd(), exe_name)
        if os.path.isfile(local_path):
            return local_path
        
        # Fallback to system PATH
        return exe_name

    def start_tunnel(self):
        self.current_url = ""
        self.root.after(0, self.update_gui_connecting)
        
        cloudflared_path = self.get_cloudflared_path()
        cmd = [cloudflared_path, "tunnel", "--url", f"http://127.0.0.1:{PORT}"]
        
        try:
            # Hide console window on Windows
            startupinfo = None
            if os.name == 'nt':
                startupinfo = subprocess.STARTUPINFO()
                startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW

            self.tunnel_process = subprocess.Popen(
                cmd, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE, 
                text=True,
                startupinfo=startupinfo
            )
            
            # Read tunnel output to extract the random HTTPS URL
            while True:
                line = self.tunnel_process.stderr.readline()
                if not line:
                    break
                if "trycloudflare.com" in line:
                    for word in line.split():
                        if "trycloudflare.com" in word:
                            self.current_url = word.strip()
                            self.root.after(0, self.update_gui_online, self.current_url)
                            break
                    break
        except FileNotFoundError:
            self.root.after(0, lambda: messagebox.showerror(
                "Cloudflared Missing", 
                "Could not find 'cloudflared'.\nPlease either install Cloudflare Tunnel and add it to your system PATH, or simply place the 'cloudflared' executable in the same folder as this application."
            ))
            self.root.after(0, self.shutdown_server)
        except Exception as e:
            print(f"Tunnel error: {e}")

    def update_gui_connecting(self):
        self.set_entry_text("Generating secure link...")
        self.lbl_status.config(text="Status: CONNECTING...", fg="#FF9800")
        self.btn_copy.config(state="disabled")
        self.btn_start.config(state="disabled")
        self.btn_refresh.config(state="disabled")
        self.btn_stop.config(state="normal")

    def update_gui_online(self, url):
        self.set_entry_text(url)
        self.lbl_status.config(text="Status: ONLINE", fg="#4CAF50")
        self.btn_copy.config(state="normal")
        self.btn_start.config(state="disabled")
        self.btn_refresh.config(state="normal")
        self.btn_stop.config(state="normal")

    def set_entry_text(self, text):
        self.entry_url.config(state="normal")
        self.entry_url.delete(0, tk.END)
        self.entry_url.insert(0, text)
        self.entry_url.config(state="readonly")

    def start_server(self):
        if not self.folder_path or not os.path.exists(self.folder_path):
            messagebox.showerror("Error", "Please select a valid folder first.")
            return

        self.is_shutting_down = False

        # Start Local HTTP Server Thread if not running
        if not self.httpd:
            self.server_thread = threading.Thread(target=self.run_http_server, daemon=True)
            self.server_thread.start()

        # Start Tunnel Thread
        threading.Thread(target=self.start_tunnel, daemon=True).start()

    def refresh_link(self):
        if self.tunnel_process:
            self.tunnel_process.terminate()
            self.tunnel_process = None
            
        self.current_url = ""
        threading.Thread(target=self.start_tunnel, daemon=True).start()

    def shutdown_server(self):
        self.is_shutting_down = True
        
        if self.tunnel_process:
            self.tunnel_process.terminate()
            self.tunnel_process = None
            
        if self.httpd:
            self.httpd.shutdown()
            self.httpd.server_close()
            self.httpd = None
        
        self.set_entry_text("")
        self.lbl_status.config(text="Status: OFFLINE", fg="#F44336")
        self.btn_start.config(state="normal")
        self.btn_refresh.config(state="disabled")
        self.btn_stop.config(state="disabled")
        self.btn_copy.config(state="disabled")

    def create_tray_image(self):
        # Create a simple icon
        image = Image.new('RGB', (64, 64), color=(33, 150, 243))
        d = ImageDraw.Draw(image)
        d.rectangle([(16, 16), (48, 48)], fill=(255, 255, 255))
        return image

    def hide_to_tray(self):
        self.root.withdraw()
        
        menu = pystray.Menu(
            pystray.MenuItem('Show GUI', self.show_from_tray, default=True),
            pystray.MenuItem('Shutdown & Exit', self.exit_app)
        )
        self.tray_icon = pystray.Icon("FileServer", self.create_tray_image(), "File Server is Running", menu)
        threading.Thread(target=self.tray_icon.run, daemon=True).start()

    def show_from_tray(self, icon=None, item=None):
        if hasattr(self, 'tray_icon'):
            self.tray_icon.stop()
        self.root.after(0, self.root.deiconify)

    def exit_app(self, icon=None, item=None):
        self.shutdown_server()
        if hasattr(self, 'tray_icon'):
            self.tray_icon.stop()
        self.root.after(0, self.root.destroy)
        sys.exit(0)

if __name__ == "__main__":
    root = tk.Tk()
    app = FileServerApp(root)
    root.mainloop()
