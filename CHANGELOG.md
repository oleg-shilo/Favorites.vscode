# Change Log

## 1.5.2 (16 May, 2021)

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
