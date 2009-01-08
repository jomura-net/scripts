<%@ page contentType="text/plain; charset=Windows-31J" import="java.io.*,java.util.*" %><%!
//
// Apache error.log Viewer
//
// 2005.03.24 Jomora created
 
// ログファイルの指定
private static final String logFile = "C:/Apache/logs/error.log";

// 表示を省略するログ
private static final String[] omittedLogs = {
  "File does not exist:",
  "client denied by server configuration:",
  "request failed: URI too long"
};
private static final int omittedLogSize = omittedLogs.length;

// 最大行数
private static int maxLineSize = 300;
// 1行の最大文字数
private static int maxLength = 4096;
%>
<%
// 表示を省略するログのカウンタ
int[] counts = new int[omittedLogSize];

ArrayList logs = new ArrayList();

// 表示するログファイルの指定
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

// 表示を省略したログのカウント
for (int i = 0; i < omittedLogSize; i++) {
    out.println(omittedLogs[i] + " " + counts[i]);
}
out.println();
// 最新のログから最大表示行数分だけ表示する
int lastIndex = logs.size() - maxLineSize;
if (lastIndex < 0) {
	lastIndex = 0;
}
for (int i = logs.size() - 1; i >= lastIndex; i--) {
    out.println(logs.get(i));
}
%>
