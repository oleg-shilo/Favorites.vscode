# Change Log


## 1.5.14 (13 Mar, 2022)

- Added context menu for setting alias (triggered by #35)
- Fixed faulty `IsPortable` detection (part of #33).

## 1.5.13 (5 Mar, 2022)

- Added support fro stock vscode icons for TreeViewItems to better align with VSCode themes. It partially addresses #5.
- Issue #34: Suggestion: If 'Data Location' setting is blank, parse it as `<default>` instead of "favorites.dataLocation": ""
- Issue #33: Possible to set 'Data Location' path to subdirectory within VSCode portable (relative to `Code.exe`).
  Changed to `DataLocation=<extensionRoot>/user-data/User/favorites.user` when it is portable VSCode deployment

## 1.5.12 (20 Feb, 2022)

- Issue #32: Chinese file name is garbled, decodeURI() var document can solve the problem. Maybe other languages have this problem too.

## 1.5.11 (27 Jan, 2022)

- Issue #31: Favorite local files in a remote session cannot be opened
- Issue #29: folders in .dav/local.list.txt should not be opened in a new window
- Added auto revealing the folder opened from Favorites
- Added new config values:
  - `favorites.disableOpeningSubfolderOfLoadedFolder` - Block opening a folder from the favorites list when its parent folder is already opened.
  - `favorites.disableOpeningSubfolder`- Disable opening sub-folders of a folder from the favorites list (regardless if the parent folder is already opened or not). This configuration value controls presence of the `<Open folder>` menu item in the favorites tree.

## 1.5.8 (20 Jan, 2022)

- Issue #30: Show full path on hover (feature request)
- Added `favorites.maxTooltipLength` configuration value.
  _Maximum length of the favorite item tooltip. Typically file path. If the path length exceeds the maximum value it is displayed truncated._

## 1.5.7 (15 Dec, 2021)

- Issue #27: Enhancement: Ability to Remove the Default List
- Issue #28: Loading a Workspace from Favorites loads the folder and not the VS Code Workspace

## 1.5.6 (23 Oct, 2021)

- Issue #26: The workspace folder gets deleted on renaming of the favorite list
- Added visual separation between root node (active list) and the list items. It is controlled via `favorites.showListSeparator` setting.

## 1.5.5 (21 Sep, 2021)

- Workspace/folder local list support is extended to process the list `.\.vscode\fav.local.list.txt`

## 1.5.4 (19 Sep, 2021)

- Fixed "The "path" argument must be of type string..."  startup error when VSCode has no Folder/Workspace open

## 1.5.3 (18 Sep, 2021)

- Fixed problem with adding workspaces to a list.
- Issue #23: Feature request: Configurable Favorites Storage (extra)
Added support for workspace local list `local.list.txt` in the workspace folder `<workspace>\.fav\`
This list can contain both absolute and relative paths. All relative paths are to be resolved against the workspace folder.
The simplest content of the `<workspace>\.fav\local.list.txt`:

```txt
.\.fav\local.list.txt
```

## 1.5.2 (23 May, 2021)

- Issue #23: Feature request: Configurable Favorites Storage
- Issue #22: Provide a way to have toggled lists
  You can create grouped lists according this pattern: `[groupname.]<list_name>.list.txt`
- Issue #17: About hiding `<default>` list

## 1.5.1 (6 Feb, 2021)

- Issue #21: Add Icon
- Updated view panel icon to address misalignment on the activity bar

## 1.5.0 (5 Feb, 2021)

- Issue #19: Open in new window
- Issue #20: Automatically open Workspace

## 1.4.0 (6 Aug, 2020)

- Issue #16: Feature request: Configurable Setting for Favorites Storage
  Implemented as config setting `dataLocation`.

## 1.3.6 (24 May, 2020)

- Issue #15: Feature Request: option for alternate names.

## 1.3.5 (30 Apr, 2020)

- Issue #11: Default value for "favorites.ownExplorer" is incorrectly defined.

## 1.3.4 (21 Mar, 2020)

- Fixed hidden command icons of the view toolbar when view is hosted in it's own activity bar.

## 1.3.3 (20 Feb, 2020)

- Added option to place _Favorites_ view in its own explorer (on activity bar).

## 1.3.2

- Issue #8: Cross-platform usage.
  Extension config.json now stores file names only instead of the full path

## 1.3.1

- Added element menu for opening all files from the current list.
- Issue #7: Possibility to add a command to open files in the favorite list?

## 1.2.2

- Changed the extension display name "Favorites" -> "Favorites Manager"
- Fixed loading the last opened favorites list at startup

## 1.2.1

- Improved error handling of the pseudo-documents (e.g. PDF or GIF viewer).

## 1.2.0

- Implemented full support for multiple Favorites' lists.

## 1.1.3

- Fixed problem with opening folder on "&lt;Open folder&gt;" node double-click.

## 1.1.2

- Implemented extending envars in the path of the item definition (Issue #2).
- Implemented 'command-node' for opening parent folder node. To address usability problems caused by VSCode TreeView item defect (Microsoft/vscode/issues/34130 and patrys/vscode-code-outline/issues/24)

## 1.1.1

- Fixed problem with settings section being hidden in VSCode contributions tab.
- Added option to show favorite's folder item sub-folders content. Controlled by `favorites.folderFilesTopLevelOnly` setting.

## 1.1.0

- Added option to show Favorite folder content (top level files). It is the response to the feature request #1.
This feature is not a substitution of the Workspace explorer view, which does by far superior job. It's just a convenience measure for a quick access of the top level folder files.  The feature can be enabled/disabled with `favorites.showFolderFiles` setting.

Note, the feature overall experience is subject to the limitations/defects of the VSCode tree view. These defects are officially reported and being dealt with by the VSCode team:
<https://github.com/Microsoft/vscode/issues/34130>
<https://github.com/patrys/vscode-code-outline/issues/24>

## 1.0.2

- Added support for folders
- Items icons reflect if file/folder exist or not
- Added context menu for moving items up/down in the list

## 1.0.1

- Updated images

## 1.0.0

- Initial release
