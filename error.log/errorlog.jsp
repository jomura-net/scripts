<%@ page contentType="text/plain; charset=Windows-31J" import="java.io.*,java.util.*" %><%!
//
// Apache error.log Viewer
//
// 2005.03.24 Jomora created
 
// ���O�t�@�C���̎w��
private static final String logFile = "C:/Apache/logs/error.log";

// �\�����ȗ����郍�O
private static final String[] omittedLogs = {
  "File does not exist:",
  "client denied by server configuration:",
  "request failed: URI too long"
};
private static final int omittedLogSize = omittedLogs.length;

// �ő�s��
private static int maxLineSize = 300;
// 1�s�̍ő啶����
private static int maxLength = 4096;
%>
<%
// �\�����ȗ����郍�O�̃J�E���^
int[] counts = new int[omittedLogSize];

ArrayList logs = new ArrayList();

// �\�����郍�O�t�@�C���̎w��
BufferedReader handle = new BufferedReader(new FileReader(logFile));
while (handle.ready()) {
    String buffer = handle.readLine();
    if (buffer.length() > maxLength) {
        buffer = buffer.substring(0, maxLength);
    }
    boolean canView = true;

    for (int i = 0; i < omittedLogSize; i++) {
	    if (canView) {
	        int index = buffer.indexOf(omittedLogs[i]);
	        if (index != -1) {
	            counts[i]++;
	            canView = false;
	        }
	    }
    }

    if (canView) {
        logs.add(buffer);
    }
}
handle.close();

// �\�����ȗ��������O�̃J�E���g
for (int i = 0; i < omittedLogSize; i++) {
    out.println(omittedLogs[i] + " " + counts[i]);
}
out.println();
// �ŐV�̃��O����ő�\���s���������\������
int lastIndex = logs.size() - maxLineSize;
if (lastIndex < 0) {
	lastIndex = 0;
}
for (int i = logs.size() - 1; i >= lastIndex; i--) {
    out.println(logs.get(i));
}
%>
