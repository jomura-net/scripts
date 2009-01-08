' n時間以内に更新されたアクセスログファイルを標準出力します。
'
' author Jomora(http://jomora.bne.jp)
' version 2005.09.14 作成

'access_logファイルがあるフォルダ
folderName = "C:/Apache/logs"
'対象とする時間(n時間前)
nDiff = 24

'**Start Encode**

'メイン関数
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
