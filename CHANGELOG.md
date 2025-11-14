# Changelog

All notable changes to the "Auto Theme Switcher" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.6] - 2024-11-14

### Added
- **Instant Theme Preview**: Themes now apply immediately when selected, no need to wait or reload

### Changed
- Theme selection now provides instant visual feedback
- Settings descriptions updated with clear instructions on how to use the visual picker

## [1.0.5] - 2024-11-14

### Added
- **Direct Commands**: `Auto Theme: Select Light Theme` and `Auto Theme: Select Dark Theme`
- Detailed instructions in settings UI explaining how to access the visual theme picker
- Emoji icons in configuration menu for better visual clarity

### Changed
- Enhanced settings descriptions with step-by-step instructions
- Improved user experience with clearer guidance on theme selection

### Technical Notes
- VS Code doesn't support dynamic dropdown menus in settings, so we use the Command Palette with QuickPick instead
- This provides a better UX with search, filtering, and visual theme indicators

## [1.0.4] - 2024-11-14

### Added
- **Build Scripts**: `build-and-install.sh` (Linux/Mac) and `build-and-install.bat` (Windows)
- Automated compilation and installation for both VS Code and Cursor

### Changed
- Improved markdown descriptions in settings with emojis and better formatting
- Added ordering to settings for better organization

## [1.0.3] - 2024-11-14

### Changed
- Removed hardcoded theme enum in favor of dynamic detection
- Settings fields now use text input with helpful instructions

## [1.0.2] - 2024-11-14

### Added
- **Quick Theme Toggle**: Click the status bar icon to instantly toggle between light and dark themes
- New command: `Auto Theme: Toggle Light/Dark Theme` for quick theme switching
- **Dynamic Theme Detection**: Automatically discovers all installed themes in VS Code/Cursor
- Enhanced theme selector with visual indicators (☀️ for light themes, 🌙 for dark themes)
- Theme type information (UI Theme) in the selection menu

### Changed
- Status bar now shows current theme state (☀️ for light, 🌙 for dark)
- Improved tooltip with auto-switch status indicator
- Better theme search and filtering in configuration menu
- Removed hardcoded theme list in favor of dynamic detection

### Fixed
- Theme selector now shows ALL installed themes, not just a predefined list
- Better handling of custom and third-party themes

## [1.0.1] - 2024-11-14

### Added
- Window focus detection: theme updates automatically when returning to the editor
- Configuration change listener: settings are applied immediately without restart
- Improved status bar with real-time theme status

### Changed
- Reduced default check interval from 5 minutes to 1 minute for better responsiveness
- Enhanced automatic theme switching reliability

### Fixed
- Theme not switching without manual reload
- Auto-switch requiring restart after configuration changes

## [1.0.0] - 2024-11-14

### Added
- Automatic theme switching based on time of day
- Configurable transition hours (day/night)
- Light and dark theme selection
- Adjustable check interval (1-60 minutes)
- Status bar indicator with current theme icon
- Commands for enable/disable and configuration
- Interactive configuration interface
- Support for VS Code and Cursor editors

### Features
- `Auto Theme: Toggle Auto Switch` - Enable/disable automatic switching
- `Auto Theme: Switch Now` - Force immediate theme update
- `Auto Theme: Configure` - Access full configuration menu
- Customizable start hours for light theme (default: 7:00)
- Customizable start hours for dark theme (default: 19:00)
- Persistent settings across sessions

---

## Future Plans

- [ ] Sunrise/sunset time detection based on location
- [ ] Multiple theme profiles
- [ ] Schedule exceptions (weekends, holidays)
- [ ] Smooth theme transitions
- [ ] Integration with system dark mode settings
