#!/usr/bin/env python3
"""
Wings Fly — File Version Watcher
ফোল্ডার watch করে, ফাইল বদলালে নিজেই backup নেয়
"""

import os, sys, time, shutil, json, threading, hashlib
from datetime import datetime
from pathlib import Path

# ─── watchdog install check ───────────────────────────
try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("Installing watchdog...")
    os.system(f'"{sys.executable}" -m pip install watchdog -q')
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler

# ─── tkinter GUI ──────────────────────────────────────
try:
    import tkinter as tk
    from tkinter import ttk, filedialog, messagebox, scrolledtext
    HAS_GUI = True
except ImportError:
    HAS_GUI = False

# ══════════════════════════════════════════════════════
# CONFIG
# ══════════════════════════════════════════════════════
MAX_VERSIONS   = 20          # প্রতিটি ফাইলের maximum versions
DEBOUNCE_SEC   = 3.0         # একই ফাইল বারবার save হলে wait করবে
WATCH_EXTS     = {           # এই extensions গুলো watch হবে
    '.js', '.html', '.css', '.json',
    '.py', '.txt', '.md', '.ts',
    '.jsx', '.tsx', '.php', '.xml'
}
BACKUP_DIR_NAME = '_file_versions'   # backup folder নাম

# ══════════════════════════════════════════════════════
# VERSION MANAGER CORE
# ══════════════════════════════════════════════════════
class VersionManager:
    def __init__(self, watch_folder: str):
        self.watch_folder = Path(watch_folder)
        self.backup_root  = self.watch_folder / BACKUP_DIR_NAME
        self.backup_root.mkdir(exist_ok=True)
        self.meta_file    = self.backup_root / 'meta.json'
        self.meta         = self._load_meta()
        self._debounce    = {}   # filename → timer

    def _load_meta(self):
        if self.meta_file.exists():
            try:
                return json.loads(self.meta_file.read_text(encoding='utf-8'))
            except: pass
        return {}

    def _save_meta(self):
        self.meta_file.write_text(
            json.dumps(self.meta, indent=2, ensure_ascii=False),
            encoding='utf-8'
        )

    def _file_hash(self, path: Path) -> str:
        try:
            return hashlib.md5(path.read_bytes()).hexdigest()[:8]
        except: return '00000000'

    def save_version(self, file_path: Path, label: str = '') -> dict | None:
        if not file_path.exists() or not file_path.is_file():
            return None

        rel = file_path.relative_to(self.watch_folder)
        key = str(rel).replace(os.sep, '/')

        # Hash check — same content হলে save করবে না
        cur_hash = self._file_hash(file_path)
        if key in self.meta and self.meta[key]['versions']:
            if self.meta[key]['versions'][0].get('hash') == cur_hash:
                return None   # no change

        ts = datetime.now()
        ts_str = ts.strftime('%Y%m%d_%H%M%S')
        ver_num = len(self.meta.get(key, {}).get('versions', [])) + 1

        # Backup folder per file
        safe_name = key.replace('/', '__')
        file_bk_dir = self.backup_root / safe_name
        file_bk_dir.mkdir(exist_ok=True)

        backup_name = f"v{ver_num:03d}_{ts_str}{file_path.suffix}"
        backup_path = file_bk_dir / backup_name

        shutil.copy2(file_path, backup_path)

        version = {
            'id'      : int(ts.timestamp() * 1000),
            'ver'     : ver_num,
            'label'   : label or f"v{ver_num} — {ts.strftime('%d %b %Y %H:%M')}",
            'ts'      : ts.isoformat(),
            'size'    : file_path.stat().st_size,
            'hash'    : cur_hash,
            'backup'  : str(backup_path),
        }

        if key not in self.meta:
            self.meta[key] = {'name': file_path.name, 'versions': []}

        self.meta[key]['versions'].insert(0, version)

        # Trim old versions
        old = self.meta[key]['versions'][MAX_VERSIONS:]
        for o in old:
            try: Path(o['backup']).unlink(missing_ok=True)
            except: pass
        self.meta[key]['versions'] = self.meta[key]['versions'][:MAX_VERSIONS]

        self._save_meta()
        return version

    def restore_version(self, key: str, version_id: int) -> bool:
        if key not in self.meta: return False
        ver = next((v for v in self.meta[key]['versions'] if v['id'] == version_id), None)
        if not ver: return False
        src = Path(ver['backup'])
        dst = self.watch_folder / key.replace('/', os.sep)
        if not src.exists(): return False
        shutil.copy2(src, dst)
        return True

    def delete_version(self, key: str, version_id: int) -> bool:
        if key not in self.meta: return False
        vlist = self.meta[key]['versions']
        ver = next((v for v in vlist if v['id'] == version_id), None)
        if not ver: return False
        try: Path(ver['backup']).unlink(missing_ok=True)
        except: pass
        self.meta[key]['versions'] = [v for v in vlist if v['id'] != version_id]
        if not self.meta[key]['versions']:
            del self.meta[key]
        self._save_meta()
        return True

    def get_files(self):
        return self.meta

    def debounce_save(self, file_path: Path):
        key = str(file_path)
        if key in self._debounce:
            self._debounce[key].cancel()
        t = threading.Timer(DEBOUNCE_SEC, self.save_version, args=[file_path])
        self._debounce[key] = t
        t.start()


# ══════════════════════════════════════════════════════
# FILE WATCHER
# ══════════════════════════════════════════════════════
class ChangeHandler(FileSystemEventHandler):
    def __init__(self, vm: VersionManager, on_change=None):
        self.vm        = vm
        self.on_change = on_change

    def _should_watch(self, path: str) -> bool:
        p = Path(path)
        if BACKUP_DIR_NAME in p.parts: return False
        if p.name.startswith('.'): return False
        return p.suffix.lower() in WATCH_EXTS

    def on_modified(self, event):
        if event.is_directory: return
        if not self._should_watch(event.src_path): return
        fp = Path(event.src_path)
        self.vm.debounce_save(fp)
        if self.on_change:
            self.on_change(f"📝 Modified: {fp.name}")

    def on_created(self, event):
        if event.is_directory: return
        if not self._should_watch(event.src_path): return
        fp = Path(event.src_path)
        time.sleep(0.5)
        ver = self.vm.save_version(fp)
        if ver and self.on_change:
            self.on_change(f"✅ New file: {fp.name} → {ver['label']}")


# ══════════════════════════════════════════════════════
# GUI
# ══════════════════════════════════════════════════════
class WatcherApp:
    def __init__(self, root: tk.Tk):
        self.root     = root
        self.vm       = None
        self.observer = None
        self.running  = False

        root.title("📁 File Version Watcher — Wings Fly")
        root.geometry("820x620")
        root.configure(bg='#0d1117')
        root.resizable(True, True)

        self._build_ui()

    # ── UI BUILD ──────────────────────────────────────
    def _build_ui(self):
        BG   = '#0d1117'
        SURF = '#161b22'
        BOR  = '#30363d'
        ACC  = '#00d4ff'
        GRN  = '#3fb950'
        RED  = '#f85149'
        TXT  = '#e6edf3'
        MUT  = '#8b949e'

        self.colors = dict(bg=BG,surf=SURF,bor=BOR,acc=ACC,grn=GRN,red=RED,txt=TXT,mut=MUT)

        # ── Top bar ───────────────────────────────────
        top = tk.Frame(self.root, bg=BG, pady=10)
        top.pack(fill='x', padx=16)

        tk.Label(top, text="📁  File Version Watcher",
                 bg=BG, fg=ACC, font=('Segoe UI', 14, 'bold')).pack(side='left')

        self.status_dot = tk.Label(top, text="●", bg=BG, fg=RED, font=('Segoe UI', 16))
        self.status_dot.pack(side='right', padx=4)
        self.status_lbl = tk.Label(top, text="Stopped", bg=BG, fg=MUT,
                                   font=('Segoe UI', 9))
        self.status_lbl.pack(side='right')

        # ── Folder row ────────────────────────────────
        frow = tk.Frame(self.root, bg=SURF, padx=12, pady=10,
                        highlightbackground=BOR, highlightthickness=1)
        frow.pack(fill='x', padx=16, pady=(0,8))

        tk.Label(frow, text="Watch Folder:", bg=SURF, fg=MUT,
                 font=('Segoe UI', 9)).pack(side='left')

        self.folder_var = tk.StringVar(value="কোনো folder select করা হয়নি")
        tk.Label(frow, textvariable=self.folder_var, bg=SURF, fg=TXT,
                 font=('Consolas', 9), wraplength=480, justify='left').pack(side='left', padx=8)

        tk.Button(frow, text="📂 Browse", bg='#21262d', fg=TXT,
                  relief='flat', cursor='hand2', font=('Segoe UI', 9, 'bold'),
                  command=self._browse, padx=10).pack(side='right', padx=4)

        self.start_btn = tk.Button(frow, text="▶ Start", bg=GRN, fg='white',
                                   relief='flat', cursor='hand2',
                                   font=('Segoe UI', 9, 'bold'),
                                   command=self._toggle, padx=14)
        self.start_btn.pack(side='right', padx=4)

        # ── Main pane ─────────────────────────────────
        pane = tk.PanedWindow(self.root, orient='horizontal',
                              bg=BG, sashwidth=4, sashrelief='flat')
        pane.pack(fill='both', expand=True, padx=16, pady=4)

        # Left — file tree
        left = tk.Frame(pane, bg=BG)
        pane.add(left, minsize=260)

        tk.Label(left, text="TRACKED FILES", bg=BG, fg=MUT,
                 font=('Consolas', 8, 'bold')).pack(anchor='w', pady=(4,4))

        tree_frame = tk.Frame(left, bg=BOR, pady=1, padx=1)
        tree_frame.pack(fill='both', expand=True)

        style = ttk.Style()
        style.theme_use('clam')
        style.configure('Dark.Treeview',
                         background=SURF, foreground=TXT,
                         fieldbackground=SURF, rowheight=26,
                         borderwidth=0, relief='flat',
                         font=('Consolas', 9))
        style.configure('Dark.Treeview.Heading',
                         background='#21262d', foreground=MUT,
                         relief='flat', font=('Segoe UI', 8, 'bold'))
        style.map('Dark.Treeview',
                  background=[('selected','#1f6feb')],
                  foreground=[('selected','white')])

        self.tree = ttk.Treeview(tree_frame, style='Dark.Treeview',
                                 columns=('vers',), show='tree headings',
                                 selectmode='browse')
        self.tree.heading('#0', text='File')
        self.tree.heading('vers', text='Vers')
        self.tree.column('#0', width=180, stretch=True)
        self.tree.column('vers', width=48, stretch=False, anchor='center')

        vsb = ttk.Scrollbar(tree_frame, orient='vertical', command=self.tree.yview)
        self.tree.configure(yscrollcommand=vsb.set)
        self.tree.pack(side='left', fill='both', expand=True)
        vsb.pack(side='right', fill='y')
        self.tree.bind('<<TreeviewSelect>>', self._on_select)

        # Right — version list
        right = tk.Frame(pane, bg=BG)
        pane.add(right, minsize=380)

        tk.Label(right, text="VERSION HISTORY", bg=BG, fg=MUT,
                 font=('Consolas', 8, 'bold')).pack(anchor='w', pady=(4,4))

        self.ver_frame = tk.Frame(right, bg=SURF,
                                  highlightbackground=BOR, highlightthickness=1)
        self.ver_frame.pack(fill='both', expand=True)

        self.ver_canvas = tk.Canvas(self.ver_frame, bg=SURF,
                                    highlightthickness=0)
        ver_vsb = ttk.Scrollbar(self.ver_frame, orient='vertical',
                                 command=self.ver_canvas.yview)
        self.ver_canvas.configure(yscrollcommand=ver_vsb.set)
        self.ver_inner = tk.Frame(self.ver_canvas, bg=SURF)
        self.ver_canvas.create_window((0,0), window=self.ver_inner, anchor='nw')
        self.ver_inner.bind('<Configure>',
            lambda e: self.ver_canvas.configure(
                scrollregion=self.ver_canvas.bbox('all')))
        self.ver_canvas.pack(side='left', fill='both', expand=True)
        ver_vsb.pack(side='right', fill='y')

        # ── Log ───────────────────────────────────────
        tk.Label(self.root, text="ACTIVITY LOG", bg=BG, fg=MUT,
                 font=('Consolas', 8, 'bold')).pack(anchor='w', padx=16)
        self.log = scrolledtext.ScrolledText(
            self.root, height=6, bg='#010409', fg='#7ee787',
            font=('Consolas', 8), relief='flat', state='disabled',
            insertbackground='white')
        self.log.pack(fill='x', padx=16, pady=(2,10))

        self._log("🚀 File Version Watcher চালু হয়েছে")
        self._log(f"   Watch extensions: {', '.join(sorted(WATCH_EXTS))}")
        self._log(f"   Max versions per file: {MAX_VERSIONS}")
        self._log("   একটা folder select করুন, তারপর Start চাপুন।")

    # ── ACTIONS ───────────────────────────────────────
    def _browse(self):
        folder = filedialog.askdirectory(title="Watch করার folder বেছে নিন")
        if folder:
            self.folder_var.set(folder)
            self._log(f"📂 Folder selected: {folder}")

    def _toggle(self):
        if self.running:
            self._stop()
        else:
            self._start()

    def _start(self):
        folder = self.folder_var.get()
        if not folder or not os.path.isdir(folder):
            messagebox.showwarning("Warning", "প্রথমে একটা valid folder select করুন!")
            return

        self.vm = VersionManager(folder)
        handler = ChangeHandler(self.vm, on_change=self._on_change)
        self.observer = Observer()
        self.observer.schedule(handler, folder, recursive=True)
        self.observer.start()
        self.running = True

        self.start_btn.config(text="⏹ Stop", bg='#f85149')
        self.status_dot.config(fg='#3fb950')
        self.status_lbl.config(text="Watching...")
        self._log(f"✅ Watching started: {folder}")
        self._refresh_tree()

    def _stop(self):
        if self.observer:
            self.observer.stop()
            self.observer.join()
            self.observer = None
        self.running = False
        self.start_btn.config(text="▶ Start", bg='#3fb950')
        self.status_dot.config(fg='#f85149')
        self.status_lbl.config(text="Stopped")
        self._log("⏹ Watching stopped.")

    def _on_change(self, msg):
        self.root.after(0, lambda: self._log(msg))
        self.root.after(500, self._refresh_tree)

    # ── LOG ───────────────────────────────────────────
    def _log(self, msg):
        ts = datetime.now().strftime('%H:%M:%S')
        self.log.config(state='normal')
        self.log.insert('end', f"[{ts}] {msg}\n")
        self.log.see('end')
        self.log.config(state='disabled')

    # ── TREE REFRESH ──────────────────────────────────
    def _refresh_tree(self):
        if not self.vm: return
        sel = self.tree.selection()
        sel_key = self.tree.item(sel[0])['values'][1] if sel else None

        for item in self.tree.get_children():
            self.tree.delete(item)

        files = self.vm.get_files()
        for key, fd in sorted(files.items()):
            cnt = len(fd['versions'])
            iid = self.tree.insert('', 'end',
                                   text=f"  {fd['name']}",
                                   values=(cnt, key))
            if key == sel_key:
                self.tree.selection_set(iid)

    def _on_select(self, event):
        sel = self.tree.selection()
        if not sel: return
        key = self.tree.item(sel[0])['values'][1]
        self._show_versions(key)

    # ── VERSION PANEL ─────────────────────────────────
    def _show_versions(self, key):
        for w in self.ver_inner.winfo_children():
            w.destroy()

        if not self.vm: return
        files = self.vm.get_files()
        if key not in files: return

        fd    = files[key]
        vers  = fd['versions']
        C     = self.colors

        # Header
        hdr = tk.Frame(self.ver_inner, bg='#21262d', pady=8, padx=12)
        hdr.pack(fill='x')
        tk.Label(hdr, text=fd['name'], bg='#21262d', fg=C['acc'],
                 font=('Consolas', 10, 'bold')).pack(side='left')
        tk.Label(hdr, text=f"  {len(vers)}/{MAX_VERSIONS} versions",
                 bg='#21262d', fg=C['mut'],
                 font=('Consolas', 8)).pack(side='left')

        # Versions
        for i, v in enumerate(vers):
            row = tk.Frame(self.ver_inner, bg=C['surf'], pady=6, padx=10)
            row.pack(fill='x', pady=1)

            # Dot
            dot_color = C['grn'] if i == 0 else C['mut']
            tk.Label(row, text='●', bg=C['surf'], fg=dot_color,
                     font=('Segoe UI', 9)).pack(side='left', padx=(0,8))

            # Info
            info = tk.Frame(row, bg=C['surf'])
            info.pack(side='left', fill='x', expand=True)
            tk.Label(info, text=v['label'], bg=C['surf'], fg=C['txt'],
                     font=('Consolas', 9, 'bold')).pack(anchor='w')
            ts_fmt = datetime.fromisoformat(v['ts']).strftime('%d %b %Y  %H:%M:%S')
            size_fmt = self._fmt_size(v.get('size', 0))
            tk.Label(info, text=f"{ts_fmt}   {size_fmt}",
                     bg=C['surf'], fg=C['mut'],
                     font=('Consolas', 7)).pack(anchor='w')

            # Restore btn
            btn_txt  = "⬇ Current" if i == 0 else "⏪ Restore"
            btn_bg   = '#1f3a1f' if i == 0 else '#1a2c3d'
            btn_fg   = C['grn']  if i == 0 else C['acc']
            vid = v['id']
            tk.Button(row, text=btn_txt, bg=btn_bg, fg=btn_fg,
                      relief='flat', cursor='hand2',
                      font=('Segoe UI', 8, 'bold'), padx=8,
                      command=lambda k=key, v=vid, n=v['label']:
                               self._restore(k, v, n)
                      ).pack(side='right', padx=2)

            # Delete btn
            tk.Button(row, text='✕', bg=C['surf'], fg='#555',
                      relief='flat', cursor='hand2',
                      font=('Segoe UI', 9), padx=4,
                      command=lambda k=key, v=vid: self._del_ver(k, v)
                      ).pack(side='right')

    def _restore(self, key, vid, label):
        if not self.vm: return
        ok = self.vm.restore_version(key, vid)
        if ok:
            self._log(f"⏪ Restored: {key} ← {label}")
            messagebox.showinfo("Restored!", f'"{label}" restore হয়েছে!\nফাইলটা আগের মতো হয়ে গেছে।')
        else:
            self._log(f"❌ Restore failed: {key}")
            messagebox.showerror("Error", "Restore করা যায়নি। Backup file missing?")

    def _del_ver(self, key, vid):
        if not messagebox.askyesno("Delete?", "এই version মুছে ফেলবেন?"): return
        if self.vm:
            self.vm.delete_version(key, vid)
            self._log(f"🗑 Deleted version from: {key}")
            self._refresh_tree()
            self._on_select(None)
            sel = self.tree.selection()
            if sel:
                k = self.tree.item(sel[0])['values'][1]
                self._show_versions(k)

    def _fmt_size(self, b):
        if b < 1024: return f"{b} B"
        if b < 1024**2: return f"{b/1024:.1f} KB"
        return f"{b/1024**2:.1f} MB"

    def on_close(self):
        self._stop()
        self.root.destroy()


# ══════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════
def main():
    if not HAS_GUI:
        print("❌ tkinter পাওয়া যায়নি। Python এর সাথে tkinter install থাকতে হবে।")
        sys.exit(1)

    root = tk.Tk()
    app  = WatcherApp(root)
    root.protocol('WM_DELETE_WINDOW', app.on_close)
    root.mainloop()

if __name__ == '__main__':
    main()
