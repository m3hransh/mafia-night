# Installing Nix

Complete guide to installing Nix package manager.

## Recommended: Determinate Systems Installer

This is the easiest and most reliable method:

```bash
curl --proto '=https' --tlsv1.2 -sSf -L \
  https://install.determinate.systems/nix | sh -s -- install
```

### Why This Installer?

- ✅ Automatically enables [[Nix Flakes]]
- ✅ Works on NixOS, Linux, macOS
- ✅ Handles multi-user setup
- ✅ Better uninstaller
- ✅ Actively maintained

## Official Installer (Alternative)

```bash
sh <(curl -L https://nixos.org/nix/install) --daemon
```

Then manually enable flakes:
```bash
mkdir -p ~/.config/nix
echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf
```

## For NixOS Users

If you're on NixOS, add to `/etc/nixos/configuration.nix`:

```nix
{
  nix.settings.experimental-features = [ "nix-command" "flakes" ];
}
```

Then rebuild:
```bash
sudo nixos-rebuild switch
```

## Verification

```bash
# Check Nix is installed
nix --version

# Check flakes are enabled
nix flake --help
```

## Post-Installation

### 1. Restart Shell
```bash
# Close and reopen terminal
# Or source the profile
source ~/.nix-profile/etc/profile.d/nix.sh
```

### 2. Install direnv (Optional)
```bash
nix profile install nixpkgs#direnv

# Add to shell (bash)
echo 'eval "$(direnv hook bash)"' >> ~/.bashrc

# Add to shell (zsh)
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc
```

See [[direnv]] for more.

### 3. Clone Project
```bash
git clone <repository-url>
cd mafia-night
direnv allow  # If using direnv
```

## What Is Nix?

Nix is a package manager that:
- **Reproducible** - Same inputs = same outputs
- **Declarative** - Describe what you want, not how
- **Atomic** - All-or-nothing installations
- **Multi-version** - Multiple versions coexist

## Flakes vs Legacy Nix

### Flakes (Modern) ✅
```bash
nix develop      # Enter dev shell
nix build        # Build package
nix run          # Run package
```

### Legacy (Old) ❌
```bash
nix-shell        # Enter dev shell
nix-build        # Build package
nix-env -i       # Install package
```

This project uses **Flakes** exclusively.

## Uninstalling

### Determinate Installer
```bash
/nix/nix-installer uninstall
```

### Official Installer
```bash
# Linux
sudo rm -rf /nix
sudo rm /etc/profile.d/nix.sh
# Remove nix-daemon user/group

# macOS
sudo rm -rf /nix
sudo dscl . delete /Users/nixbld*
sudo dscl . delete /Groups/nixbld
```

## Troubleshooting

### SELinux Issues (Fedora/RHEL)
```bash
# Disable SELinux temporarily
sudo setenforce 0

# Or add context
sudo chcon -Rt svirt_sandbox_file_t /nix
```

### macOS Catalina+ Volumes
Installer should handle this automatically. If issues:
```bash
# Check /nix is mounted
mount | grep /nix

# Should show synthetic.conf entry
cat /etc/synthetic.conf
```

### Multi-User Setup Failed
```bash
# Use single-user (not recommended for production)
sh <(curl -L https://nixos.org/nix/install) --no-daemon
```

## Related Notes

- [[Nix Flakes]] - What Nix Flakes does
- [[Quick Start]] - Get started quickly
- [[Environment Setup]] - What you get
- [[direnv]] - Auto-loading setup

## Further Reading

- Official docs: https://nixos.org/download
- Determinate Systems: https://determinate.systems/
- Flakes guide: `docs/guides/NIX_FLAKES_GUIDE.md`

---

#nix #installation #setup
