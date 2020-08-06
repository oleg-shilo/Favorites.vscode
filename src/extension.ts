'use strict';

import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { FavoritesTreeProvider, FavoriteItem } from './tree_view';
import { Uri, commands } from 'vscode';
import { ExecSyncOptionsWithBufferEncoding } from 'child_process';
let expandenv = require('expandenv');

let outputChannel = vscode.window.createOutputChannel("CS-Script3");

function get_favorites_items() {
    if (fs.existsSync(Utils.fav_file)) {
        return Utils.read_all_lines(Utils.fav_file).filter(x => x != '' && !x.startsWith("#")).map(x => expandenv(x));
    }
    else {
        vscode.window.showErrorMessage(`The list ${path.basename(Utils.fav_file)} is not found. Loading the default Favorites list instead.`);
        Utils.setCurrentFavFile(Utils.fav_default_file);
        commands.executeCommand('favorites.refresh');
    }
}

function get_current_list_name() {
    return path.basename(Utils.fav_file).replace(".list.txt", "");
}

function get_favorites_lists() {
    return Utils.fav_lists;
}

function add_workspace(element: FavoriteItem) {
    if (vscode.workspace.rootPath)
        _add(vscode.workspace.rootPath);
}

function alt_cmd(element: FavoriteItem) {
    vscode.window.showErrorMessage('alt_cmd');
}

function add(element: FavoriteItem) {
    if (!vscode.window.activeTextEditor) {
        vscode.window.showErrorMessage('The path of the active document is not available.');
    }
    else {
        let document = vscode.window.activeTextEditor.document.fileName;
        _add(document);
    }
}

function _add(document: string) {

    let lines: string[] = Utils.read_all_lines(Utils.fav_file);

    if (lines.find(x => x == document) != null) {
        vscode.window.showErrorMessage('The active document is already in the Favorites.');
    }
    else {
        lines.push(document);

        Utils.write_all_lines(Utils.fav_file, lines.filter(x => x != ''));

        commands.executeCommand('favorites.refresh');
    }
}

function up(element: FavoriteItem) {

    let lines = Utils.read_all_lines(Utils.fav_file).filter(x => x != '');

    let index = lines.indexOf(element.context);
    if (index != -1 && index != 0) {
        lines.splice(index, 1);
        lines.splice(index - 1, 0, element.context);
    }

    Utils.write_all_lines(Utils.fav_file, lines);

    commands.executeCommand('favorites.refresh');
}

function down(element: FavoriteItem) {

    let lines = Utils.read_all_lines(Utils.fav_file).filter(x => x != '');

    let index = lines.indexOf(element.context);
    if (index != -1 && index <= lines.length) {
        lines.splice(index, 1);
        lines.splice(index + 1, 0, element.context);
    }

    Utils.write_all_lines(Utils.fav_file, lines);

    commands.executeCommand('favorites.refresh');
}

function remove(element: FavoriteItem) {
    let lines: string[] = [];

    Utils.read_all_lines(Utils.fav_file)
        .filter(x => x != '')
        .forEach(x => {
            if (x != element.context)
                lines.push(x);
        });

    Utils.write_all_lines(Utils.fav_file, lines);

    commands.executeCommand('favorites.refresh');
}

function edit_list(element: FavoriteItem) {
    vscode.workspace
        .openTextDocument(Uri.file(element.context))
        .then(vscode.window.showTextDocument);
}

function remove_list(element: FavoriteItem) {
    if (element.context.endsWith("Default.list.txt")) {
        vscode.window.showErrorMessage("Error: you can only delete non default favorites list.");
    }
    else {

        if (element.context == Utils.fav_file) {
            Utils.setCurrentFavFile("Default.list.txt");
            fs.unlinkSync(element.context);
        }
        else {
            fs.unlinkSync(element.context);
            commands.executeCommand('favorites.refresh');
        }
    }
}

function open_all_files(element: FavoriteItem) {

    try {
        let lines: string[] = Utils.read_all_lines(Utils.fav_file);

        lines.forEach(file => {
            if (fs.existsSync(file) && Utils.is_file(file)) {
                commands.executeCommand('vscode.open', Uri.file(file));
            }
        });
    } catch (error) {

    }
}

function file_name_sanatize(text: string): string {
    return text.replace(/[\/\?<>\\:\*\|":]/g, "_");
}

function rename_list(element: FavoriteItem) {

    if (element.context.endsWith("Default.list.txt")) {
        vscode.window.showErrorMessage("Error: you can only rename non default favorites list.");
    }
    else {
        let options: vscode.InputBoxOptions = {
            prompt: "Enter the new file name for the selected Favorites list",
            placeHolder: "ex.: Test scripts",
        };

        vscode.window.showInputBox(options)
            .then(value => {
                if (value) {
                    value = file_name_sanatize(value);
                    let new_file = path.join(Utils.user_dir, value + ".list.txt");

                    try {
                        fs.renameSync(element.context, new_file);
                        commands.executeCommand('favorites.refresh');
                    } catch (error) {
                        vscode.window.showErrorMessage(error.message);
                    }
                }
            });
    }
}

function edit() {
    vscode.workspace
        .openTextDocument(Uri.file(Utils.fav_file))
        .then(vscode.window.showTextDocument);
}

function load(list: string) {
    Utils.setCurrentFavFile(list);
    commands.executeCommand('favorites.refresh');
}

function new_list() {
    let options: vscode.InputBoxOptions = {
        prompt: "Enter the file name of the new Favorites list",
        placeHolder: "ex.: Test scripts",
    };

    vscode.window.showInputBox(options)
        .then(value => {
            if (value) {
                value = file_name_sanatize(value);
                Utils.createNewList(value);
                commands.executeCommand('favorites.refresh');
            }
        });
}

function get_user_dir(): string {

    // ext_context.storagePath cannot be used as it is undefined if no workspace loaded

    // vscode:
    // Windows %appdata%\Code\User\settings.json
    // Mac $HOME/Library/Application Support/Code/User/settings.json
    // Linux $HOME/.config/Code/User/settings.json

    let dataLocation = vscode.workspace.getConfiguration("favorites").get('dataLocation', '<default>');

    if (dataLocation != '<default>') {

        try {
            fs.mkdirSync(dataLocation);
        } catch (error) {
            if (error.code != 'EEXIST') {
                vscode.window.showErrorMessage("Custom data directory ('" + dataLocation + "') cannot be accessed/created. Falling back to the default data location.");
            }
        }

        return dataLocation;
    }

    if (os.platform() == 'win32')
        return path.join(process.env.APPDATA, 'Code', 'User', 'favorites.user');
    else if (os.platform() == 'darwin')
        return path.join(process.env.HOME, 'Library', 'Application Support', 'Code', 'User', 'favorites.user');
    else
        return path.join(process.env.HOME, '.config', 'Code', 'User', 'favorites.user');
}

export function activate(context: vscode.ExtensionContext) {

    FavoritesTreeProvider.user_dir = get_user_dir();

    const treeViewProvider = new FavoritesTreeProvider(get_favorites_items, get_favorites_lists, get_current_list_name);

    vscode.window.registerTreeDataProvider("favorites-own-view", treeViewProvider);
    vscode.window.registerTreeDataProvider("favorites-explorer-view", treeViewProvider);

    vscode.commands.registerCommand('favorites.load', load);
    vscode.commands.registerCommand('favorites.alt_cmd', alt_cmd);
    vscode.commands.registerCommand('favorites.new_list', new_list);
    vscode.commands.registerCommand('favorites.refresh', () => treeViewProvider.refresh(false));
    vscode.commands.registerCommand('favorites.refresh_all', () => treeViewProvider.refresh(true));
    vscode.commands.registerCommand('favorites.edit', edit);
    vscode.commands.registerCommand('favorites.edit_list', edit_list);
    vscode.commands.registerCommand('favorites.add_workspace', add_workspace);
    vscode.commands.registerCommand('favorites.add', add);
    vscode.commands.registerCommand('favorites.remove', remove);
    vscode.commands.registerCommand('favorites.remove_list', remove_list);
    vscode.commands.registerCommand('favorites.rename_list', rename_list);
    vscode.commands.registerCommand('favorites.open_all_files', open_all_files);
    vscode.commands.registerCommand('favorites.move_up', up);
    vscode.commands.registerCommand('favorites.move_down', down);
}

class Utils {
    private static _fav_file: string = null;
    static user_dir: string;

    static get fav_lists(): string[] {
        let files: string[] = [];
        fs.readdirSync(Utils.user_dir)
            .forEach(fileName => {
                let file = path.join(Utils.user_dir, fileName);

                if (fs.lstatSync(file).isFile() && file.endsWith(".list.txt")) {
                    files.push(file);
                }
            });

        return files;
    }

    static get fav_file(): string {
        if (Utils._fav_file == null)
            Utils.setCurrentFavFile(Utils.ensure_fav_file());
        return Utils._fav_file;
    }
    static get fav_default_file(): string {
        let default_list = path.join(Utils.user_dir, 'Default.list.txt');
        if (!fs.existsSync(default_list))
            Utils.write_all_lines(default_list, []);
        return default_list;
    }

    public static read_all_lines(file: string): string[] {
        let text = fs.readFileSync(file, 'utf8');
        return text.split(/\r?\n/g);
    }

    public static read_all_text(file: string): string {
        let text = fs.readFileSync(file, 'utf8');
        return text;
    }

    public static write_all_lines(file: string, lines: string[]): void {
        fs.writeFileSync(file, lines.join('\n'), { encoding: 'utf8' });
    }

    public static write_all_text(file: string, text: string): void {
        fs.writeFileSync(file, text, { encoding: 'utf8' });
    }

    public static create_dir(dir: string): void {
        let mkdirp = require('mkdirp');
        // fs.mkdirSync can only create the top level dir but mkdirp creates all child sub-dirs that do not exist 
        if (!fs.existsSync(dir)) {
            const allRWEPermissions = parseInt("0777", 8);
            mkdirp.sync(dir, allRWEPermissions);
        }
    }

    public static is_file(path: string): boolean {
        var fs = require('fs');
        var stats = fs.statSync(path);
        return stats.isFile();
    }

    // ----------------------------------------
    static migrate_old_version_to(): void {
        let old_user_dir = Utils.user_dir.replace('favorites.user', 'cs-script.user');

        let file = path.join(Utils.user_dir, 'default.list.txt');
        let old_file = path.join(old_user_dir, 'favorites.txt');

        if (fs.existsSync(old_file)) {
            if (!fs.existsSync(file)) {
                fs.renameSync(old_file, file);
            }
        }
    }

    static current_list: string;

    static createNewList(list_name: string): void {
        let file = path.join(Utils.user_dir, list_name + ".list.txt");
        Utils.write_all_lines(file, ["# The content below is just a Favorites list sample", "--- Section A ---", file]);
        Utils.setCurrentFavFile(file);
    }

    static setCurrentFavFile(list_name: string): void {

        let file = list_name;

        if (!path.isAbsolute(file))
            file = path.join(Utils.user_dir, list_name);

        if (Utils._fav_file && Utils._fav_file != file)
            fs.unwatchFile(file, (curr: any, prev: any) =>
                commands.executeCommand('favorites.refresh'));

        fs.watchFile(file, (curr: any, prev: any) =>
            commands.executeCommand('favorites.refresh'));

        Utils._fav_file = file;

        let list_short_name = list_name.replace(Utils.user_dir + path.sep, "");
        let config = JSON.stringify({ "current": list_short_name });

        Utils.write_all_text(path.join(Utils.user_dir, 'config.json'), config);
    }

    static ensure_fav_file(): string {

        Utils.user_dir = get_user_dir();

        Utils.create_dir(Utils.user_dir);

        Utils.migrate_old_version_to();

        let default_list = Utils.fav_default_file; // 'Default.list.txt'

        let config_file = path.join(Utils.user_dir, 'config.json');
        if (!fs.existsSync(config_file)) {
            let config = { "current": 'Default.list.txt' };
            Utils.write_all_text(config_file, JSON.stringify(config));
        }

        try {
            let config = JSON.parse(Utils.read_all_text(config_file));
            if (path.isAbsolute(config.current))
                return config.current;
            else
                return path.join(Utils.user_dir, config.current);

        } catch (error) {
            return default_list;
        }
    }
}