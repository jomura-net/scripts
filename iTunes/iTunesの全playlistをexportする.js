/*
 * iTunes‚Ì‘Splaylist‚ðexport‚·‚é.js
 *
 * @author kazuhiko@jomura.net
 * @version 2024.05.03 init
 */

WScript.Echo("start : " + new Date());

// config
var libRootPath = "E:/iTunes/iTunes Media/Music/";
var playlistPath = "E:/iTunes/iTunes Media/playlists/";

// const
var adostrm = WScript.CreateObject("ADODB.Stream");
adostrm.Charset = "UTF-8";   // with BOM
var fs = WScript.CreateObject("Scripting.FileSystemObject");
var iTunesApp = WScript.CreateObject("iTunes.Application");

// main

for (var e = new Enumerator(fs.GetFolder(playlistPath).Files); !e.atEnd(); e.moveNext()){
    if (e.item().Name.match("\.m3u$")) {
        fs.DeleteFile(e.item());
    }
}

for (var i = 1; i <= iTunesApp.LibrarySource.Playlists.Count; i++) {
    var plist = iTunesApp.LibrarySource.Playlists.Item(i);
    WScript.Echo(plist.Name + " : " + plist.Tracks.Count);

    if ( 0 == plist.Tracks.Count
        || plist.Name === "Library"
        || plist.Name === "Music"
        || plist.Name === "other"
        || plist.Name === "specials") {
            continue;
    }

    adostrm.Open();
    adostrm.WriteText("#EXTM3U", 1);
    for (var j = 1; j <= plist.Tracks.Count; j++) {
        location = plist.Tracks.Item(j).Location;
        location = location.replace(libRootPath, "");
        adostrm.WriteText(location, 1);
    }
    adostrm.SaveToFile(playlistPath + plist.Name + ".m3u", 2);
    adostrm.Close();
}

iTunesApp.Quit();

WScript.Echo("end : " + new Date());
