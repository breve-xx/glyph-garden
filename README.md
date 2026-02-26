# Vowel Like a Mac

A GNOME 49 Shell extension that replicates macOS-style accented vowel input.
Press **Super+Alt+Vowel** to open a centered popup of diacritical variants, then
select one to copy it to your clipboard. The modifier prefix is fully
configurable.

![GNOME 49](https://img.shields.io/badge/GNOME-49-blue)
![Wayland](https://img.shields.io/badge/Wayland-compatible-green)
![License](https://img.shields.io/badge/License-GPL--3.0-orange)

## Features

- **Super+Alt+A/E/I/O/U** opens a centered accent menu (default shortcuts)
- **Shift** modifier with the shortcut opens the uppercase variant menu
- **Configurable modifier prefix** — change all shortcuts at once via preferences
  (choose from Super+Alt, Ctrl+Alt, Super+Shift, Ctrl+Shift, etc.)
- Individual per-vowel shortcut overrides available
- Navigate with **← →** arrow keys, **Home/End**, or **h/l** (vim-style)
- Select with **Enter** or click, or press **1–9** for direct selection
- **Escape** to dismiss
- Selected character is copied to the system clipboard
- Fully configurable shortcuts via GNOME Extensions preferences

### Supported Characters

| Shortcut | Characters |
|----------|------------|
| Super+Alt+A | à á â ã ä å ā ă ą |
| Super+Alt+E | è é ê ë ē ė ę ě |
| Super+Alt+I | ì í î ï ī į ĩ |
| Super+Alt+O | ò ó ô õ ö ø ō ő |
| Super+Alt+U | ù ú û ü ū ů ű ų |

Add Shift to any shortcut for uppercase variants. The `Super+Alt` prefix can be
changed to any modifier combination in the preferences.

## Project Structure

```
vowel-like-a-mac/
├── metadata.json          # Extension manifest (UUID, GNOME version)
├── extension.js           # Main logic: popup, keybindings, clipboard
├── prefs.js               # Preferences UI for shortcut configuration
├── stylesheet.css         # Popup styling
├── schemas/
│   └── ...gschema.xml     # GSettings schema for keybindings
├── Makefile               # Build, install, package targets
├── Containerfile          # Docker/Podman container for testing from macOS
└── README.md
```

## Building & Installing

### On a Linux Machine

```bash
# Compile the GSettings schema and install
make install

# Log out and back in (required on Wayland), then enable:
gnome-extensions enable vowel-like-a-mac@gnome-extensions
```

### Create a Distributable Package

```bash
make package
# Creates dist/vowel-like-a-mac@gnome-extensions.zip

# Install the package on any GNOME 49 machine:
gnome-extensions install vowel-like-a-mac@gnome-extensions.zip
```

## macOS → Linux Development Workflow

Since this extension requires GNOME Shell (Linux), here are three approaches
for developing on macOS:

### Option 1: Docker/Podman Container (Build & Validate)

Best for: Compiling schemas, running lint checks, packaging.

```bash
# Build the container image
docker build -t vowel-mac-dev -f Containerfile .

# Run lint checks
docker run --rm vowel-mac-dev

# Compile schemas & package
docker run --rm -v $(pwd)/dist:/extension/dist vowel-mac-dev make package

# Interactive shell for debugging
docker run --rm -it vowel-mac-dev bash
```

### Option 2: Remote Linux VM (Full GUI Testing)

Best for: End-to-end testing with a real GNOME desktop.

```bash
# 1. Provision a VM (any cloud provider with Fedora 42 / Ubuntu 25.04)
#    Ensure GNOME desktop is installed:
#    sudo dnf install @workstation-product-environment  # Fedora
#    sudo apt install ubuntu-desktop                    # Ubuntu

# 2. Copy the extension to the VM
scp -r . user@vm-ip:~/vowel-like-a-mac/

# 3. SSH in and install
ssh user@vm-ip
cd ~/vowel-like-a-mac
make install

# 4. For GUI access, use VNC or remote desktop:
#    sudo dnf install tigervnc-server  # Fedora
#    vncserver :1 -geometry 1920x1080
#    Then connect from macOS with any VNC client

# 5. Enable the extension
gnome-extensions enable vowel-like-a-mac@gnome-extensions
```

### Option 3: GNOME OS / Fedora in a VM (Local)

Best for: Fully local testing with GUI support.

```bash
# Use UTM (macOS virtualization app) or QEMU:
# 1. Download Fedora 42 Workstation ISO
# 2. Create a VM with UTM (https://mac.getutm.app)
# 3. Install Fedora with GNOME desktop
# 4. Share a folder or use SSH to sync files
# 5. Install and test as above
```

### Iterative Development Tips

```bash
# Quick rebuild & reinstall cycle (on Linux VM/container):
make clean && make install

# Watch GNOME Shell logs for errors:
journalctl -f -o cat /usr/bin/gnome-shell

# Check extension status:
gnome-extensions info vowel-like-a-mac@gnome-extensions

# Disable the extension:
gnome-extensions disable vowel-like-a-mac@gnome-extensions
```

## Configuring Shortcuts

Open GNOME Extensions preferences:

```bash
gnome-extensions prefs vowel-like-a-mac@gnome-extensions
```

### Modifier Prefix (Recommended)

The preferences window has a **Modifier Prefix** dropdown at the top. Changing
it updates all five vowel shortcuts at once. Available presets:

| Preset | Shortcuts become |
|--------|-----------------|
| Super+Alt *(default)* | Super+Alt+A, Super+Alt+E, … |
| Ctrl+Alt | Ctrl+Alt+A, Ctrl+Alt+E, … |
| Super+Shift | Super+Shift+A, Super+Shift+E, … |
| Ctrl+Shift | Ctrl+Shift+A, Ctrl+Shift+E, … |
| Super+Ctrl+Alt | Super+Ctrl+Alt+A, … |
| Super+Ctrl | Super+Ctrl+A, … |

### Per-Vowel Overrides

Below the prefix selector, each vowel has a **Set** button for recording a
custom shortcut and a **Reset** button to restore the default.

### Using dconf

```bash
# Change the modifier prefix:
dconf write /org/gnome/shell/extensions/vowel-like-a-mac/modifier-prefix "'<Ctrl><Alt>'"

# View current shortcut for vowel A:
dconf read /org/gnome/shell/extensions/vowel-like-a-mac/accent-vowel-a

# Change shortcut for vowel A to Ctrl+Alt+A:
dconf write /org/gnome/shell/extensions/vowel-like-a-mac/accent-vowel-a "['<Ctrl><Alt>a']"
```

## Troubleshooting

**Extension doesn't appear after install:**
- On Wayland, you must log out and back in after installing
- Check: `gnome-extensions list | grep vowel`

**Shortcuts don't work:**
- Another extension or system shortcut may conflict — change the modifier prefix in preferences
- Check: `gnome-extensions prefs vowel-like-a-mac@gnome-extensions`

**Popup doesn't show:**
- Ensure the extension is enabled: `gnome-extensions info vowel-like-a-mac@gnome-extensions`
- Look for errors in shell logs

## License

GPL-3.0 — see the GNOME extensions guidelines.
