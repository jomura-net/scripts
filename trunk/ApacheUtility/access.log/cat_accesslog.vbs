' n���Ԉȓ��ɍX�V���ꂽ�A�N�Z�X���O�t�@�C����W���o�͂��܂��B
'
' author Jomora(http://jomora.bne.jp)
' version 2005.09.14 �쐬

'access_log�t�@�C��������t�H���_
folderName = "C:/Apache/logs"
'�ΏۂƂ��鎞��(n���ԑO)
nDiff = 24

'**Start Encode**

'���C���֐�
Set fso = CreateObject("Scripting.FileSystemObject")
Set folder = fso.GetFolder(folderName)
For Each file In folder.Files
	ext = LCase(fso.GetExtensionName(file))
    If (Left(file.Name,7) = "access_") AND (ext = "log") Then
    	timeDiff = DateDiff("h", file.DateLastModified, Now)
    	If timeDiff <= nDiff Then
			Set stream = fso.OpenTextFile(file)
			Do While Not stream.AtEndOfStream
			    str = stream.ReadLine
			    WScript.StdOut.WriteLine(str)
			Loop
			stream.Close()
    	End If
    End If
Next

WScript.Quit
