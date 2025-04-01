[![stand with Ukraine](https://img.shields.io/badge/stand_with-ukraine-ffd700.svg?labelColor=0057b7)](https://stand-with-ukraine.pp.ua)
# Favorites - VSCode Extension

Manage and quickly access frequently used files, folders and favorites' lists.

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.cs-script.net/cs-script/Donation.html)   <br>    Visual Studio Marketplace: [Favorites Manager](https://marketplace.visualstudio.com/items?itemName=oleg-shilo.favorites) 

--- 

## Overview

This simple extension allows adding, removing and managing documents in the globally maintained Favorites' list(s).

This extensions is similar to other plugins of the "Favorites" family. Though apart from traditional item context menu and buttons this plugin offers an extremely simple and intuitive way of structuring your favorites.

The items definition is just a text document that can be freely edited with the changes reflected in the VSCode panel automatically after saving the file.

Another distinction points are the ability to have both _file_ and _folder_ items as well as the ability to switch between multiple Favorites' lists. This is particularly useful for grouping favorite items according the problem domain into individual lists, which can be easily switched depending on the user activity.

## Key Features

The functionality is self explanatory and includes following features:

* The items can be either files or folders
* Support for custom/multiple favorites lists.
* Opening document or folder by clicking (or double-clicking) the item in the _Favorites_ list.
* Managing items and lists via the dedicated toolbar button or the node context menu.
* Refreshing (reloading) _Favorites_ via the dedicated toolbar button.
* Moving items up and down in the list
* Managing (editing) _Favorites_ list directly in _VSCode_. Once the _Favorites_ list definition is edited and saved the changes are automatically reflected in the _Favorites_ panel. Below is a sample of the _Favorites_ list definition.

### _Managing list items:_

![image](https://raw.githubusercontent.com/oleg-shilo/Favorites.vscode/master/resources/images/favorites_vscode.gif)

### _Managing lists:_

![image](https://raw.githubusercontent.com/oleg-shilo/Favorites.vscode/master/resources/images/codemap.lists.gif)

### _Using extension_

Using the extension is stright forward. Just click the item in the Favourites list tree and the corresponding document will be opened in the current window.
If you are dealing with the item that represents a folder then you can also click a command item to open the  folder in VSCode _as a folder_. This command item has an int=uiotive appearance:
  
![image](https://github.com/user-attachments/assets/2ae86a05-9f3d-4c4c-831b-7a20795cd9a1)

If you are a "keyboard person" and prefer to open the documents from the Favorites list by using keystrokes only, then you can use VSCode QuickPick feature that is fully integrated with the extension:

`Ctrl+Shift+P`

![image](https://github.com/user-attachments/assets/daf86b50-c9bc-4aac-8cab-ffbf9d3294e2)

Then select the item from the list that is a complete equivalent of the normal Favorites tree view and press `Enter`:

![image](https://github.com/user-attachments/assets/9c7b8cd7-abfe-4fb3-9f4c-1c5499c14b18)

## List definition rules

The item definition (in "&lt;name&gt;.list.txt") may contain environment variables, which  are extended at runtime into a full path:

```txt
$USERPROFILE\AppData\Roaming\Code\User\cs-script.user\new_script.cs
```

In cases if an alternative display title (alias) for a file is desired you can use this simple syntax to achieve that: `<file path>|<file alias>`

![image](https://user-images.githubusercontent.com/16729806/156863567-e039de94-5a94-4c05-9b24-5e1d633c1e0a.png)

The definition syntax also allows comments - any line that starts with '#'.

And you can also use non-path text as an items' separator (e.g. `"|-- Folders --"`). Any line that starts with `|` is interpreted as a separator. It makes sense as `|<separator>` is nothing else but a specific case of `<file path>|<file alias>` definition where file path is empty and the display name is just a text that you want to display on the non-clickable item.

The extension also allows showing Favorite folder item content.
This feature is not a substitution of the Workspace explorer view, which does by far superior job. It's just a convenience measure for a quick access of the top level folder files. The feature can be enabled/disabled with `favorites.showFolderFiles` setting.

You can group some lists that are somewhat logically related. The groping is based on the naming convention: `[group_name.]<list_name>.list.txt`

![](resources/images/favorites_grouping.png)

There is another type of customization that helps manage excessive amount lists. Thus some lists can be workspace/folder specific. This means that if you have a workspace/folder opened and some of the configured lists are marked as folder specific (associated with the folder) then only these lists will be shown in the lists tree.

You can associate or disassociate a list by selecting the list selecting the desired action from the context (right-click) menu.

![](resources/images/folder_specific.png)

### _Data Location_

The default location of all Favorite lists folder depends on the host operating system:

* **Windows:** %appdata%\Code\User\favorites.user
* **Mac:** $HOME/Library/Application Support/Code/User/favorites.user
* **Linux:** $HOME/.config/Code/User/favorites.user

If for whatever reason you want to manage your lists in custom location then you can achieve it by seting Favorites `favorites.dataLocation` configuration value to your preferred folder path.

This feature represents an interesting opportunity when you can spscify the location for the lists based on the workspace folder. Thus if you set the configuration to `${workspaceFolder}\.vscode` then all your lists will be managed from the workspace-specific folder `.vscode` if VSCode has workspace/folder opened. Otherwise the lists will be managed from the default location.

### _Experimental features_

From v1.5.3 you can use a workspace local list specific for the workspace location. There are two possible locations and file names for this type of list:
 - `<workspace>/.fav/local.list.txt`
 - `<workspace>/.vscode/fav.local.list.txt` 
This list can only be added, removed and edited manually.

This list can contain both absolute and relative paths. All relative paths are resolved at runtime against the workspace folder.
The simplest content of the `<workspace>\.fav\local.list.txt`:

```txt 
.\.fav\local.list.txt 
```

## Limitations

* _ShowFolderFiles_ feature overall experience is subject to the limitations/defects of the VSCode tree view. Thus TreeView node always triggers node selection when you try to expand it. This defect is officially reported and being dealt with by the VSCode team:<br/>
   https://github.com/Microsoft/vscode/issues/34130<br/>
   https://github.com/patrys/vscode-code-outline/issues/24<br/>

## Hints/Tips

* By default VSCode opens any file clicked from the  _Favorites_ list in the so called "preview mode". Thus the document tabs are reused and every new file is opened in the same tab. If you prefer to open a clicked _Favorites_ document in a new tab then you need to disable document the previewMode is the settings:
  1. Use _Command Palette_ to open your settings file ("Preferences: Open User Settings")
  2. Add the "workbench.editor.enablePreview" property, and set it's value to _false_.
* Use "favorites.singleListMode" to disable support for multiple lists and hide the `<Default>` tree view item as well as the whole list selection UI elements.
