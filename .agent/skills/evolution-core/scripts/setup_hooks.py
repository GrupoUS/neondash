#!/usr/bin/env python3
"""
Evolution Core - Universal Hook Installer
Automatically detects and configures hooks for multiple AI IDEs
"""

import os
import json
import sys
from pathlib import Path
from typing import Dict, List, Optional

class HookInstaller:
    def __init__(self):
        self.script_dir = Path(__file__).parent.absolute()
        self.config_file = self.script_dir / "ide_configs.json"
        self.ide_configs = self.load_ide_configs()
        
    def load_ide_configs(self) -> Dict:
        """Load IDE configuration mappings."""
        with open(self.config_file, 'r') as f:
            return json.load(f)
    
    def expand_path(self, path: str) -> Path:
        """Expand ~ and environment variables in path."""
        return Path(os.path.expanduser(os.path.expandvars(path)))
    
    def detect_installed_ides(self) -> List[str]:
        """Detect which IDEs are installed on the system."""
        installed = []
        for ide_key, config in self.ide_configs.items():
            config_path = self.expand_path(config['config_file'])
            config_dir = config_path.parent
            
            if config_dir.exists():
                installed.append(ide_key)
                print(f"✓ Detected {config['name']} at {config_dir}")
        
        return installed
    
    def get_hook_config(self, ide_key: str) -> Dict:
        """Generate hook configuration for a specific IDE."""
        post_tool_use_path = str(self.script_dir / "post_tool_use_hook.py")
        heartbeat_path = str(self.script_dir / "heartbeat.py")
        
        return {
            "PostToolUse": [
                {
                    "matcher": "*",
                    "hooks": [
                        {
                            "type": "command",
                            "command": f"python3 {post_tool_use_path}"
                        }
                    ]
                }
            ],
            "Stop": [
                {
                    "matcher": "*",
                    "hooks": [
                        {
                            "type": "command",
                            "command": f"python3 {heartbeat_path} --trigger stop"
                        }
                    ]
                }
            ]
        }
    
    def backup_config(self, config_path: Path) -> None:
        """Create a backup of the existing configuration."""
        if config_path.exists():
            backup_path = config_path.with_suffix('.json.backup')
            import shutil
            shutil.copy2(config_path, backup_path)
            print(f"  📦 Backup created: {backup_path}")
    
    def install_hooks_for_ide(self, ide_key: str, dry_run: bool = False) -> bool:
        """Install hooks for a specific IDE."""
        config = self.ide_configs[ide_key]
        config_path = self.expand_path(config['config_file'])
        
        print(f"\n🔧 Installing hooks for {config['name']}...")
        
        # Create config directory if it doesn't exist
        config_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Load existing config or create new one
        if config_path.exists():
            self.backup_config(config_path)
            with open(config_path, 'r') as f:
                try:
                    existing_config = json.load(f)
                except json.JSONDecodeError:
                    existing_config = {}
        else:
            existing_config = {}
        
        # Merge hook configuration
        hook_config = self.get_hook_config(ide_key)
        
        if 'hooks' not in existing_config:
            existing_config['hooks'] = {}
        
        existing_config['hooks'].update(hook_config)
        
        if dry_run:
            print(f"  [DRY RUN] Would write to: {config_path}")
            print(f"  [DRY RUN] Config: {json.dumps(hook_config, indent=2)}")
            return True
        
        # Write updated configuration
        with open(config_path, 'w') as f:
            json.dump(existing_config, f, indent=2)
        
        print(f"  ✅ Hooks installed successfully!")
        print(f"  📝 Config file: {config_path}")
        
        return True
    
    def interactive_install(self) -> None:
        """Interactive installation process."""
        print("=" * 60)
        print("🧬 Evolution Core - Universal Hook Installer")
        print("=" * 60)
        print()
        
        # Detect installed IDEs
        print("🔍 Detecting installed AI IDEs...")
        installed_ides = self.detect_installed_ides()
        
        if not installed_ides:
            print("\n❌ No supported IDEs detected.")
            print("\nSupported IDEs:")
            for ide_key, config in self.ide_configs.items():
                print(f"  - {config['name']}: {config['config_file']}")
            print("\nPlease install one of the supported IDEs first.")
            sys.exit(1)
        
        print(f"\n✨ Found {len(installed_ides)} IDE(s)")
        print()
        
        # Ask user which IDEs to configure
        print("Which IDEs would you like to configure?")
        print("  [a] All detected IDEs")
        for i, ide_key in enumerate(installed_ides, 1):
            print(f"  [{i}] {self.ide_configs[ide_key]['name']} only")
        print("  [q] Quit")
        print()
        
        choice = input("Your choice: ").strip().lower()
        
        if choice == 'q':
            print("Installation cancelled.")
            sys.exit(0)
        
        selected_ides = []
        if choice == 'a':
            selected_ides = installed_ides
        elif choice.isdigit() and 1 <= int(choice) <= len(installed_ides):
            selected_ides = [installed_ides[int(choice) - 1]]
        else:
            print("Invalid choice. Exiting.")
            sys.exit(1)
        
        # Confirm installation
        print("\n📋 Installation Summary:")
        for ide_key in selected_ides:
            print(f"  - {self.ide_configs[ide_key]['name']}")
        print()
        
        confirm = input("Proceed with installation? [y/N]: ").strip().lower()
        if confirm != 'y':
            print("Installation cancelled.")
            sys.exit(0)
        
        # Install hooks
        success_count = 0
        for ide_key in selected_ides:
            if self.install_hooks_for_ide(ide_key):
                success_count += 1
        
        # Summary
        print("\n" + "=" * 60)
        print(f"✅ Installation complete! ({success_count}/{len(selected_ides)} successful)")
        print("=" * 60)
        print("\n📚 Next steps:")
        print("  1. Restart your IDE to load the new hooks")
        print("  2. Start the memory worker: bash scripts/run_worker.sh")
        print("  3. Copy assets to your workspace: cp -r assets/* /your/workspace/")
        print("\n💡 For detailed instructions, see README.md")
        print()

def main():
    """Main entry point."""
    installer = HookInstaller()
    
    # Check for command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == '--help' or sys.argv[1] == '-h':
            print("Evolution Core - Universal Hook Installer")
            print("\nUsage:")
            print("  python3 setup_hooks.py           # Interactive mode")
            print("  python3 setup_hooks.py --help    # Show this help")
            sys.exit(0)
    
    # Run interactive installation
    installer.interactive_install()

if __name__ == "__main__":
    main()
