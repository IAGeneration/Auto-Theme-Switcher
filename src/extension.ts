import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;
let checkInterval: ReturnType<typeof setInterval> | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Auto Theme Switcher activated');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'auto-theme-switcher.toggleAutoSwitch';
    context.subscriptions.push(statusBarItem);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('auto-theme-switcher.toggleAutoSwitch', toggleAutoSwitch)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('auto-theme-switcher.switchNow', switchThemeNow)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('auto-theme-switcher.configure', configureThemes)
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

async function configureThemes() {
    const config = vscode.workspace.getConfiguration('autoThemeSwitcher');
    
    const options = [
        'Change light theme',
        'Change dark theme',
        'Configure light theme start hour',
        'Configure dark theme start hour',
        'Configure check interval'
    ];

    const choice = await vscode.window.showQuickPick(options, {
        placeHolder: 'What would you like to configure?'
    });

    if (!choice) {
        return;
    }

    switch (choice) {
        case 'Change light theme':
            await selectTheme('lightTheme', 'Select light theme');
            break;
        case 'Change dark theme':
            await selectTheme('darkTheme', 'Select dark theme');
            break;
        case 'Configure light theme start hour':
            await configureHour('lightThemeStartHour', 'Enter light theme start hour (0-23)');
            break;
        case 'Configure dark theme start hour':
            await configureHour('darkThemeStartHour', 'Enter dark theme start hour (0-23)');
            break;
        case 'Configure check interval':
            await configureInterval();
            break;
    }
}

async function selectTheme(configKey: string, prompt: string) {
    // Get all available themes
    const extensions = vscode.extensions.all;
    const themes: string[] = [];
    
    extensions.forEach(ext => {
        const contributes = ext.packageJSON?.contributes;
        if (contributes?.themes) {
            contributes.themes.forEach((theme: any) => {
                if (theme.label) {
                    themes.push(theme.label);
                }
            });
        }
    });

    // Add default themes
    const defaultThemes = [
        'Default Dark Modern',
        'Default Light Modern',
        'Default Dark+',
        'Default Light+',
        'Visual Studio Dark',
        'Visual Studio Light'
    ];

    const allThemes = [...new Set([...defaultThemes, ...themes])].sort();

    const selectedTheme = await vscode.window.showQuickPick(allThemes, {
        placeHolder: prompt
    });

    if (selectedTheme) {
        await vscode.workspace.getConfiguration('autoThemeSwitcher').update(
            configKey,
            selectedTheme,
            vscode.ConfigurationTarget.Global
        );
        vscode.window.showInformationMessage(`Theme configured: ${selectedTheme}`);
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
    
    if (enabled) {
        const now = new Date();
        const currentHour = now.getHours();
        const lightThemeStartHour = config.get<number>('lightThemeStartHour', 7);
        const darkThemeStartHour = config.get<number>('darkThemeStartHour', 19);
        
        let icon: string;
        if (lightThemeStartHour < darkThemeStartHour) {
            icon = (currentHour >= lightThemeStartHour && currentHour < darkThemeStartHour) ? '☀️' : '🌙';
        } else {
            icon = (currentHour >= darkThemeStartHour && currentHour < lightThemeStartHour) ? '🌙' : '☀️';
        }
        
        statusBarItem.text = `${icon} Auto Theme`;
        statusBarItem.tooltip = 'Automatic theme switching active (Click to disable)';
    } else {
        statusBarItem.text = '⏸️ Auto Theme';
        statusBarItem.tooltip = 'Automatic theme switching disabled (Click to enable)';
    }
    
    statusBarItem.show();
}

