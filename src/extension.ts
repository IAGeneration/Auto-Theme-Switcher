import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;
let checkInterval: ReturnType<typeof setInterval> | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Auto Theme Switcher activated');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'auto-theme-switcher.toggleTheme';
    context.subscriptions.push(statusBarItem);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('auto-theme-switcher.toggleTheme', toggleTheme)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('auto-theme-switcher.toggleAutoSwitch', toggleAutoSwitch)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('auto-theme-switcher.switchNow', switchThemeNow)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('auto-theme-switcher.configure', configureThemes)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('auto-theme-switcher.selectLightTheme', selectLightTheme)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('auto-theme-switcher.selectDarkTheme', selectDarkTheme)
    );

    // Listen for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('autoThemeSwitcher')) {
                startAutoSwitch();
                updateStatusBar();
            }
        })
    );

    // Check theme when window becomes focused
    context.subscriptions.push(
        vscode.window.onDidChangeWindowState(e => {
            if (e.focused) {
                switchThemeBasedOnTime();
            }
        })
    );

    // Start automatic checking
    startAutoSwitch();
    updateStatusBar();

    // Apply theme immediately on startup
    switchThemeBasedOnTime();
}

export function deactivate() {
    if (checkInterval) {
        clearInterval(checkInterval);
    }
}

function startAutoSwitch() {
    const config = vscode.workspace.getConfiguration('autoThemeSwitcher');
    const enabled = config.get<boolean>('enabled', true);
    const checkIntervalMinutes = config.get<number>('checkInterval', 5);

    if (checkInterval) {
        clearInterval(checkInterval);
    }

    if (enabled) {
        // Check every X minutes
        checkInterval = setInterval(() => {
            switchThemeBasedOnTime();
        }, checkIntervalMinutes * 60 * 1000);
    }
}

function stopAutoSwitch() {
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = undefined;
    }
}

function switchThemeBasedOnTime() {
    const config = vscode.workspace.getConfiguration('autoThemeSwitcher');
    const enabled = config.get<boolean>('enabled', true);

    if (!enabled) {
        return;
    }

    const now = new Date();
    const currentHour = now.getHours();
    
    const lightThemeStartHour = config.get<number>('lightThemeStartHour', 7);
    const darkThemeStartHour = config.get<number>('darkThemeStartHour', 19);
    const lightTheme = config.get<string>('lightTheme', 'Default Light Modern');
    const darkTheme = config.get<string>('darkTheme', 'Default Dark Modern');

    let targetTheme: string;
    let targetThemeType: 'light' | 'dark';

    // Determine which theme to use
    if (lightThemeStartHour < darkThemeStartHour) {
        // Normal case: light=7am, dark=7pm
        if (currentHour >= lightThemeStartHour && currentHour < darkThemeStartHour) {
            targetTheme = lightTheme;
            targetThemeType = 'light';
        } else {
            targetTheme = darkTheme;
            targetThemeType = 'dark';
        }
    } else {
        // Inverted case: light=7pm, dark=7am (unlikely but handled)
        if (currentHour >= darkThemeStartHour && currentHour < lightThemeStartHour) {
            targetTheme = darkTheme;
            targetThemeType = 'dark';
        } else {
            targetTheme = lightTheme;
            targetThemeType = 'light';
        }
    }

    // Get current theme
    const currentTheme = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme');

    // Change theme only if different
    if (currentTheme !== targetTheme) {
        vscode.workspace.getConfiguration('workbench').update(
            'colorTheme',
            targetTheme,
            vscode.ConfigurationTarget.Global
        ).then(() => {
            vscode.window.showInformationMessage(
                `Theme switched to: ${targetTheme} (${targetThemeType})`
            );
        });
    }

    updateStatusBar();
}

function toggleTheme() {
    const config = vscode.workspace.getConfiguration('autoThemeSwitcher');
    const lightTheme = config.get<string>('lightTheme', 'Default Light Modern');
    const darkTheme = config.get<string>('darkTheme', 'Default Dark Modern');
    const currentTheme = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme');
    
    // Determine which theme to switch to
    let targetTheme: string;
    let targetThemeType: 'light' | 'dark';
    
    // If current theme is the light theme, switch to dark, otherwise switch to light
    if (currentTheme === lightTheme) {
        targetTheme = darkTheme;
        targetThemeType = 'dark';
    } else {
        targetTheme = lightTheme;
        targetThemeType = 'light';
    }
    
    // Apply the theme
    vscode.workspace.getConfiguration('workbench').update(
        'colorTheme',
        targetTheme,
        vscode.ConfigurationTarget.Global
    ).then(() => {
        vscode.window.showInformationMessage(
            `Switched to ${targetThemeType} theme: ${targetTheme}`
        );
        updateStatusBar();
    });
}

function toggleAutoSwitch() {
    const config = vscode.workspace.getConfiguration('autoThemeSwitcher');
    const currentlyEnabled = config.get<boolean>('enabled', true);
    
    config.update('enabled', !currentlyEnabled, vscode.ConfigurationTarget.Global).then(() => {
        if (!currentlyEnabled) {
            startAutoSwitch();
            vscode.window.showInformationMessage('Automatic theme switching enabled');
        } else {
            stopAutoSwitch();
            vscode.window.showInformationMessage('Automatic theme switching disabled');
        }
        updateStatusBar();
    });
}

function switchThemeNow() {
    switchThemeBasedOnTime();
    vscode.window.showInformationMessage('Theme updated based on current time');
}

async function selectLightTheme() {
    await selectTheme('lightTheme', '☀️ Select your daytime (light) theme');
}

async function selectDarkTheme() {
    await selectTheme('darkTheme', '🌙 Select your nighttime (dark) theme');
}

async function configureThemes() {
    const config = vscode.workspace.getConfiguration('autoThemeSwitcher');
    
    const options = [
        '☀️ Change light theme',
        '🌙 Change dark theme',
        '🌅 Configure light theme start hour',
        '🌙 Configure dark theme start hour',
        '⏱️ Configure check interval'
    ];

    const choice = await vscode.window.showQuickPick(options, {
        placeHolder: 'What would you like to configure?'
    });

    if (!choice) {
        return;
    }

    switch (choice) {
        case '☀️ Change light theme':
            await selectLightTheme();
            break;
        case '🌙 Change dark theme':
            await selectDarkTheme();
            break;
        case '🌅 Configure light theme start hour':
            await configureHour('lightThemeStartHour', 'Enter light theme start hour (0-23)');
            break;
        case '🌙 Configure dark theme start hour':
            await configureHour('darkThemeStartHour', 'Enter dark theme start hour (0-23)');
            break;
        case '⏱️ Configure check interval':
            await configureInterval();
            break;
    }
}

async function selectTheme(configKey: string, prompt: string) {
    // Get all available themes dynamically
    const extensions = vscode.extensions.all;
    const themesMap = new Map<string, { label: string; uiTheme?: string }>();
    
    // Scan all extensions for theme contributions
    extensions.forEach(ext => {
        const contributes = ext.packageJSON?.contributes;
        if (contributes?.themes) {
            contributes.themes.forEach((theme: any) => {
                if (theme.label || theme.id) {
                    const themeLabel = theme.label || theme.id;
                    themesMap.set(themeLabel, {
                        label: themeLabel,
                        uiTheme: theme.uiTheme
                    });
                }
            });
        }
    });

    // Convert to sorted array
    const allThemes = Array.from(themesMap.values())
        .sort((a, b) => a.label.localeCompare(b.label));

    // Create quick pick items with details
    const quickPickItems = allThemes.map(theme => {
        let description = '';
        if (theme.uiTheme === 'vs') {
            description = '☀️ Light';
        } else if (theme.uiTheme === 'vs-dark' || theme.uiTheme === 'hc-black') {
            description = '🌙 Dark';
        }
        
        return {
            label: theme.label,
            description: description,
            detail: theme.uiTheme ? `UI Theme: ${theme.uiTheme}` : undefined
        };
    });

    const selectedTheme = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: prompt,
        matchOnDescription: true,
        matchOnDetail: true
    });

    if (selectedTheme) {
        await vscode.workspace.getConfiguration('autoThemeSwitcher').update(
            configKey,
            selectedTheme.label,
            vscode.ConfigurationTarget.Global
        );
        
        // Apply the theme immediately to preview it
        await vscode.workspace.getConfiguration('workbench').update(
            'colorTheme',
            selectedTheme.label,
            vscode.ConfigurationTarget.Global
        );
        
        vscode.window.showInformationMessage(`✓ Theme configured and applied: ${selectedTheme.label}`);
        updateStatusBar();
    }
}

async function configureHour(configKey: string, prompt: string) {
    const input = await vscode.window.showInputBox({
        prompt: prompt,
        value: vscode.workspace.getConfiguration('autoThemeSwitcher').get<number>(configKey)?.toString(),
        validateInput: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 0 || num > 23) {
                return 'Please enter a number between 0 and 23';
            }
            return null;
        }
    });

    if (input) {
        const hour = parseInt(input);
        await vscode.workspace.getConfiguration('autoThemeSwitcher').update(
            configKey,
            hour,
            vscode.ConfigurationTarget.Global
        );
        vscode.window.showInformationMessage(`Hour configured: ${hour}:00`);
        startAutoSwitch(); // Restart with new settings
    }
}

async function configureInterval() {
    const input = await vscode.window.showInputBox({
        prompt: 'Enter check interval in minutes (1-60)',
        value: vscode.workspace.getConfiguration('autoThemeSwitcher').get<number>('checkInterval')?.toString(),
        validateInput: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 1 || num > 60) {
                return 'Please enter a number between 1 and 60';
            }
            return null;
        }
    });

    if (input) {
        const interval = parseInt(input);
        await vscode.workspace.getConfiguration('autoThemeSwitcher').update(
            'checkInterval',
            interval,
            vscode.ConfigurationTarget.Global
        );
        vscode.window.showInformationMessage(`Interval configured: ${interval} minutes`);
        startAutoSwitch(); // Restart with new interval
    }
}

function updateStatusBar() {
    const config = vscode.workspace.getConfiguration('autoThemeSwitcher');
    const enabled = config.get<boolean>('enabled', true);
    const currentTheme = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme');
    const lightTheme = config.get<string>('lightTheme', 'Default Light Modern');
    
    // Determine icon based on current theme
    const icon = currentTheme === lightTheme ? '☀️' : '🌙';
    
    statusBarItem.text = `${icon} Theme`;
    statusBarItem.tooltip = `Click to toggle theme\n${enabled ? '✓ Auto-switch enabled' : '✗ Auto-switch disabled'}`;
    statusBarItem.show();
}

