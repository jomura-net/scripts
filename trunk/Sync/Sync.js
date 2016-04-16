/*
 * �w�肳�ꂽ2�̃t�H���_�̓��������܂��B
 * srcFolder�̓��e��destFolder�Ƀ~���[�����O���܂��B
 *
 * �t�@�C���̃R�s�[�ɂ́uxcopy /D /S /E /C /I /H /R /K /Y�v���g�p���Ă��܂��B
 * ���O�t�@�C�����w��ł��܂��B
 *
 *  usage: cscript Sync.js ���葤 �󂯑�
 *         [/EXCLUDE:�t�@�C��1[+�t�@�C��2][+�t�@�C��3]...]
 *
 * @author Jomora ( kazuhiko@jomura.net http://jomura.net )
 * @version 2016.04.17 �w�肵���t�H���_�������O�o�͂���悤�ɕύX
 *          2010.02.09 xcopy�̕W���G���[���o�͂���悤�ɕύX
 *          2009.01.27 ��̃t�H���_���R�s�[����悤�ɕύX
 *          2009.01.08 xcopy�I�v�V�������R�}���h���C���̌��ɕύX
 *          2007.05.01 �t�H���_�w����_�u���N�H�[�g�ň͂ނ悤�ɕύX
 *          2006.05.13 �u���ݔ��ֈړ��v����u�t�@�C���폜�v�ɕύX
 *          2006.01.23 ���O�o�͕�����ύX
 *          2005.09.30 �t�@�C�����폜�����A���ݔ��ֈړ�����悤�ύX
 *          2005.09.20 ���O��W���o�͂���悤�ύX
 *          2005.09.19 �쐬
 */

//**Start Encode**

var fso = new ActiveXObject("Scripting.FileSystemObject");

//�������擾
var argsNamed = WScript.Arguments.Named;
var argsUnnamed = WScript.Arguments.Unnamed;
if (argsUnnamed.length < 2) {
	usage("����������܂���B");
}
var srcFolderPath = argsUnnamed.Item(0);
var destFolderPath = argsUnnamed.Item(1);
var excludeFileName = argsNamed.Item("EXCLUDE");
if (!fso.FolderExists(srcFolderPath)) {
	usage("�w�肳�ꂽ�t�H���_(" + srcFolderPath + ")��������܂���B");
}
if (!fso.FolderExists(destFolderPath)) {
	fso.CreateFolder(destFolderPath);
}

var srcFolder = fso.GetFolder(srcFolderPath);
var destFolder = fso.GetFolder(destFolderPath);
srcFolderPath = srcFolder.Path;
destFolderPath = destFolder.Path;
srcParentFolderPath = fso.GetParentFolderName(srcFolderPath);
destParentFolderPath = fso.GetParentFolderName(destFolderPath);

// ���C��
copy();
deleteFiles(destFolder);

WScript.Quit();


function deleteFiles(destFolder) {
	var fc = new Enumerator(destFolder.Files);
	for(; !fc.atEnd(); fc.moveNext()) {
		var srcFilePath = fc.item().Path.replace(destFolderPath, srcFolderPath);
		if (!fso.FileExists(srcFilePath)) {
			log("[delete] " + fc.item().Path.replace(destParentFolderPath, ""));
			fc.item().Delete(true);
			//remove(fc.item().Path);
		}
	}
	var subFolders = new Enumerator(destFolder.SubFolders);
	for(; !subFolders.atEnd(); subFolders.moveNext()) {
		deleteFiles(subFolders.item());
		deleteFolder(subFolders.item());
	}
}

function deleteFolder(folder) {
	var folderItemPath = folder.Path.replace(destFolderPath, srcFolderPath);
	if (!fso.FolderExists(folderItemPath)) {
		log("[delete folder] " + folder.Path.replace(destParentFolderPath, ""));
		folder.Delete(true);
	}
/*
	if (folder.Files.Count == 0 && folder.SubFolders.Count == 0) {
		log("[delete folder] " + folder.Path.replace(destFolderPath + "\\", ""));
		folder.Delete(true);
	}
*/
}

function copy() {
	var WshShell = new ActiveXObject("WScript.Shell");
	var exOpt = "";
	if (excludeFileName) {
		exOpt = " /EXCLUDE:" + excludeFileName + " ";
	}
	var commandStr = "xcopy \"" + srcFolderPath + "\" \"" + destFolderPath + "\" /D /S /E /C /I /H /R /K /Y" + exOpt;
//	WScript.Echo(commandStr);
	var oExec = WshShell.Exec(commandStr);

	var errStr;
	var quit = false;
	while(true) {
		while (!oExec.StdOut.AtEndOfStream) {
			line = oExec.StdOut.ReadLine();
			path = line.replace(srcParentFolderPath, "");
			if (line != path) {
				log("[create] " + path);
			}
		}
		while(!oExec.StdErr.AtEndOfStream) {
			errStr = oExec.StdErr.ReadAll();
			WScript.StdErr.WriteLine(errStr);
		}
		if(quit) {
			break;
		}
		quit = (oExec.Status == 1);
	}
	
	if (errStr) {
		//�G���[�I��
		WScript.Quit(1);
	}
}

function usage(message) {
	WScript.Echo(message + "\n\n usage: cscript //nologo Sync.js ���葤 �󂯑�\n        [/EXCLUDE:�t�@�C��1[+�t�@�C��2][+�t�@�C��3]...]");
	WScript.Quit(1);
}

function log(message) {
	var now = new Date();
	year = now.getYear();
	month = now.getMonth() + 1;
	date = now.getDate();
	hour = now.getHours();
	minute = now.getMinutes();
	second = now.getSeconds();
	dateStr = year + "/" + TwoDigits(month) + "/" + TwoDigits(date) + " " + TwoDigits(hour) + ":" + TwoDigits(minute) + ":" + TwoDigits(second);

	WScript.StdOut.WriteLine(dateStr + " " + message);
}

function TwoDigits(number) {
	if (number < 10) {
		number = "0" + number;
	}
	return number;
}

function remove(filepath) {
	var shell = new ActiveXObject("Shell.Application");
	filepath = fso.GetAbsolutePathName(filepath);
	var folder = shell.NameSpace(fso.GetParentFolderName(filepath));
	if (folder != null) {
		var folderItem = folder.ParseName(fso.GetFileName(filepath));
		if (folderItem != null) {
			folderItem.InvokeVerb("�폜(&D)");
			folderItem = null;
		}
		folder = null;
	}
}
