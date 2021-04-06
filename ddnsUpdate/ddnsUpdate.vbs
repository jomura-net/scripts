'
' DDNS�X�V�y�[�W�����N�G�X�g���A
' IP�A�h���X�ɕύX���������ꍇ�A�C�x���g���O�����[������X�N���v�g
' (value domain��)
'
' usage)
'   >cscript //B //nologo ddnsUpdate.vbs �h���C���� �p�X���[�h [�z�X�g��]
'     �� �z�X�g���ȗ��̏ꍇ�́A"*"�ƂȂ�B
'
' author kazuhiko@jomura.net (http://jomura.net/)
'
' version 2012.10.06 DNS�T�[�o��IP���擾���Ă��܂��s����C��
' version 2012.06.10 �z�X�g���w����\��
' version 2010.10.17 IP���t�@�C���Ɋi�[����悤�ɕύX
' version 2009.09.04 DDNS�����R�}���h���C��������
' version 2008.03.29 SMTP Auth�Ή� (POP before SMTP�Ή��폜)
' version 2007.04.24 value domain�p�ɉ��C
' version 2006.05.27 ���s���t�E������W���o�͂���悤�ɕύX
' version 2006.05.22 �G���[���ɂ����[�����M����悤�ɕύX
' version 2006.05.14 livedoor domain�p��IP�ύX���[���ʒm�@�\ �ǉ�
' version 2006.03.17 livedoor domain�p�ɕύX
' version 2005.10.03 POP before SMTP �Ή�
' version 2005.06.21 ServerXMLHTTP�ɕύX�AsetTimeouts��ǉ�
' version 2005.06.05 �쐬


' IP�A�h���X�ɕύX�����������Ƃ����[���Œʒm���邩�ǂ���
Const useMailAlertIPChanged = True
Const smtpSrv = "smtp.gmail.com"
Const smtpPort = 465
Const mailFrom = "noreply@jomura.net"
Const mailTo = "ddns@jomura.net"

' IP�A�h���X�ύX���[���ʒm�̍ہASMTP Auth�𗘗p���邩�ǂ���
Const useSMTPAuth = True
Const useSMTPSSL = True
Const sendUsername = "user@jomora.net"
Const sendPassword = "********"

Const dnsSrv = "1.1.1.1"

' �ȉ��A�ύX�̕K�v�͂Ȃ��͂� (do not change below)

' value domain��DDNS�X�V���
Set objArgs=WScript.Arguments.Unnamed
If objArgs.Count < 2 Then
	WScript.StdOut.WriteLine "ddnsDomainName��ddnsPassword���A�����Ŏw�肵�Ă��������B"
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

' ���C�����[�`��
'WScript.StdOut.WriteLine "-----" & now()

'DDNS�X�V
ddnsResponseText = GetDDNSResponseText()
WScript.StdOut.Write ddnsResponseText

'��IP�A�h���X���擾
'oldIP = GetIPFromNSLookup(ddnsHostNameFull)
oldIP = GetIPFromFile(ddnsHostNameFull)
WScript.StdOut.WriteLine "oldIP : " & oldIP

'�VIP�A�h���X���擾
newIP = GetIPFromNSLookup(ddnsHostNameFull)
WScript.StdOut.WriteLine "newIP : " & newIP

'IP�A�h���X�ɍX�V���������ꍇ�A�ʒm
If oldIP <> newIP Then
    Call SetIPToFile(ddnsHostNameFull, newIP)
    Call PrintLog(4, "[DDNS] IP�A�h���X�X�V(" & ddnsHostNameFull & ":" & newIP & ")", ddnsResponseText & vbCrLf & oldIP & " -> " & newIP, True)
End If

WScript.Quit


' �ȉ��T�u���[�`��

Function GetDDNSResponseText()
	GetDDNSResponseText = ""

	'DDNS�X�V�y�[�W���ꎞ�t�@�C���Ƃ��ăo�C�i���`���Ń_�E�����[�h
	Set objHTTP = WScript.CreateObject("MSXML2.ServerXMLHTTP")
	objHTTP.Open "GET", url, False, False, False
	objHTTP.setTimeouts 3000, 3000, 3000, 30000 'ServerXMLHTTP���p��
	objHTTP.Send

	If objHTTP.status <> 200 Then
	    Call PrintLog(2, "[DDNS] ���ʂ̎擾�Ɏ��s���܂��� (HTTP STATUS:" & objHTTP.status & ")", ddnsResponseText, False)
	    WScript.Quit(1)
	End If

	GetDDNSResponseText = objHTTP.responseText
	If GetDDNSResponseText = "" Then
	    Call PrintLog(1, "[DDNS] ���X�|���X�� null �ł�", ddnsResponseText, False)
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
		Call PrintLog(1, "[DDNS] IP�擾�Ɏ��s���܂���", line_all, False)
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

' IP�A�h���X�ύX���ʏo��
Sub PrintLog(status, title, message, sendMail)
	WScript.StdOut.WriteLine title & vbCrLf & message

    '�C�x���g���O�ɋL�^
    Set objShell = CreateObject("WScript.Shell")
    Call objShell.LogEvent(status, title & vbCrLf & message)

    '���[�����M
	If useMailAlertIPChanged And sendMail Then
		Call SMTPSend(title, message)
	End If
End Sub

Sub SMTPSend(subject, mailBody)
	'���[�����M
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
	Wscript.Echo "���[���𑗐M���܂����B"
End Sub
