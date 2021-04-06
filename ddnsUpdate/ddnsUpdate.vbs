'
' DDNS更新ページをリクエストし、
' IPアドレスに変更があった場合、イベントログ＆メールするスクリプト
' (value domain版)
'
' usage)
'   >cscript //B //nologo ddnsUpdate.vbs ドメイン名 パスワード [ホスト名]
'     ※ ホスト名省略の場合は、"*"となる。
'
' author kazuhiko@jomura.net (http://jomura.net/)
'
' version 2012.10.06 DNSサーバのIPを取得してしまう不具合を修正
' version 2012.06.10 ホスト名指定を可能に
' version 2010.10.17 IPをファイルに格納するように変更
' version 2009.09.04 DDNS情報をコマンドライン引数化
' version 2008.03.29 SMTP Auth対応 (POP before SMTP対応削除)
' version 2007.04.24 value domain用に改修
' version 2006.05.27 実行日付・時刻を標準出力するように変更
' version 2006.05.22 エラー時にもメール送信するように変更
' version 2006.05.14 livedoor domain用のIP変更メール通知機能 追加
' version 2006.03.17 livedoor domain用に変更
' version 2005.10.03 POP before SMTP 対応
' version 2005.06.21 ServerXMLHTTPに変更、setTimeoutsを追加
' version 2005.06.05 作成


' IPアドレスに変更があったことをメールで通知するかどうか
Const useMailAlertIPChanged = True
Const smtpSrv = "smtp.gmail.com"
Const smtpPort = 465
Const mailFrom = "noreply@jomura.net"
Const mailTo = "ddns@jomura.net"

' IPアドレス変更メール通知の際、SMTP Authを利用するかどうか
Const useSMTPAuth = True
Const useSMTPSSL = True
Const sendUsername = "user@jomora.net"
Const sendPassword = "********"

Const dnsSrv = "1.1.1.1"

' 以下、変更の必要はないはず (do not change below)

' value domainのDDNS更新情報
Set objArgs=WScript.Arguments.Unnamed
If objArgs.Count < 2 Then
	WScript.StdOut.WriteLine "ddnsDomainNameとddnsPasswordを、引数で指定してください。"
	WScript.Quit(1)
End If
ddnsDomainName = objArgs.Item(0)
ddnsPassword = objArgs.Item(1)
ddnsHostName = "*"
ddnsHostNameFull = ddnsDomainName
If objArgs.Count > 2 Then
	ddnsHostName = objArgs.Item(2)
	ddnsHostNameFull = ddnsHostName & "." & ddnsDomainName
End If

url = "https://dyn.value-domain.com/cgi-bin/dyn.fcg?d=" & ddnsDomainName & "&p=" & ddnsPassword & "&h=" & ddnsHostName

'**Start Encode**

' メインルーチン
'WScript.StdOut.WriteLine "-----" & now()

'DDNS更新
ddnsResponseText = GetDDNSResponseText()
WScript.StdOut.Write ddnsResponseText

'旧IPアドレスを取得
'oldIP = GetIPFromNSLookup(ddnsHostNameFull)
oldIP = GetIPFromFile(ddnsHostNameFull)
WScript.StdOut.WriteLine "oldIP : " & oldIP

'新IPアドレスを取得
newIP = GetIPFromNSLookup(ddnsHostNameFull)
WScript.StdOut.WriteLine "newIP : " & newIP

'IPアドレスに更新があった場合、通知
If oldIP <> newIP Then
    Call SetIPToFile(ddnsHostNameFull, newIP)
    Call PrintLog(4, "[DDNS] IPアドレス更新(" & ddnsHostNameFull & ":" & newIP & ")", ddnsResponseText & vbCrLf & oldIP & " -> " & newIP, True)
End If

WScript.Quit


' 以下サブルーチン

Function GetDDNSResponseText()
	GetDDNSResponseText = ""

	'DDNS更新ページを一時ファイルとしてバイナリ形式でダウンロード
	Set objHTTP = WScript.CreateObject("MSXML2.ServerXMLHTTP")
	objHTTP.Open "GET", url, False, False, False
	objHTTP.setTimeouts 3000, 3000, 3000, 30000 'ServerXMLHTTP利用時
	objHTTP.Send

	If objHTTP.status <> 200 Then
	    Call PrintLog(2, "[DDNS] 結果の取得に失敗しました (HTTP STATUS:" & objHTTP.status & ")", ddnsResponseText, False)
	    WScript.Quit(1)
	End If

	GetDDNSResponseText = objHTTP.responseText
	If GetDDNSResponseText = "" Then
	    Call PrintLog(1, "[DDNS] レスポンスが null です", ddnsResponseText, False)
	    WScript.Quit(1)
	End If
End Function

Function GetIPFromNSLookup(hostname)
	GetIPFromNSLookup = ""
	line_all = ""
	dnsserver = True

	Set regEx = New RegExp
	regEx.Pattern = "^Address"

	Set WshShell = WScript.CreateObject("WScript.Shell")
	Set Pipe = WshShell.Exec("nslookup -timeout=5 " & hostname & ". " & dnsSrv)
	Do Until Pipe.StdOut.AtEndOfStream
		line = Pipe.StdOut.ReadLine()
		line_all = line_all & line & vbCrLf
		If regEx.Test(line) Then
			If dnsserver Then
				dnsserver = False
			Else
				GetIPFromNSLookup = Split(line, " ")(2)
				Exit Do
			End If
		End If
	Loop

	If GetIPFromNSLookup = "" Then
		Call PrintLog(1, "[DDNS] IP取得に失敗しました", line_all, False)
		WScript.Quit(1)
	End If
End Function

Function GetIPFromFile(hostname)
	GetIPFromFile = ""
	Set fso = CreateObject("Scripting.FileSystemObject")
	If (fso.FileExists(hostname)) Then
		GetIPFromFile = fso.OpenTextFile(hostname, 1).ReadLine
	End If
End Function

Sub SetIPToFile(hostname, ipaddr)
	Set fso = CreateObject("Scripting.FileSystemObject")
	Set tmpFile = fso.OpenTextFile(hostname, 2, True)
	tmpFile.WriteLine(ipaddr)
	tmpFile.close
	Set tmpFile = Nothing
	Set fso = Nothing
End Sub

' IPアドレス変更結果出力
Sub PrintLog(status, title, message, sendMail)
	WScript.StdOut.WriteLine title & vbCrLf & message

    'イベントログに記録
    Set objShell = CreateObject("WScript.Shell")
    Call objShell.LogEvent(status, title & vbCrLf & message)

    'メール送信
	If useMailAlertIPChanged And sendMail Then
		Call SMTPSend(title, message)
	End If
End Sub

Sub SMTPSend(subject, mailBody)
	'メール送信
	Set oMsg = CreateObject("CDO.Message")
	schemas = "http://schemas.microsoft.com/cdo/configuration/"
	oMsg.Configuration.Fields.Item (schemas & "sendusing") = 2
'	oMsg.Configuration.Fields.Item (schemas & "languagecode") = "iso-2022-jp"
	oMsg.Configuration.Fields.Item (schemas & "smtpserver") = smtpSrv
	oMsg.Configuration.Fields.Item (schemas & "smtpauthenticate") = useSMTPAuth
	oMsg.Configuration.Fields.Item (schemas & "sendusername") = sendUsername
	oMsg.Configuration.Fields.Item (schemas & "sendpassword") = sendPassword
	oMsg.Configuration.Fields.Item (schemas & "smtpserverport") = smtpPort
	oMsg.Configuration.Fields.Item (schemas & "smtpusessl") = useSMTPSSL
	oMsg.Configuration.Fields.Update

'	oMsg.MimeFormatted = True
	oMsg.Fields.Item("urn:schemas:mailheader:X-Mailer") = "ddnsUpdate.vbs"
	oMsg.Fields.Update()

	oMsg.From = mailFrom
	oMsg.To = mailTo
	oMsg.Subject = subject
	oMsg.BodyPart.Charset = "ISO-2022-JP"
	oMsg.TextBody = mailBody
'	oMsg.TextBodyPart.Charset = "ISO-2022-JP"

	oMsg.Send
	Set oMsg = Nothing
	Wscript.Echo "メールを送信しました。"
End Sub
