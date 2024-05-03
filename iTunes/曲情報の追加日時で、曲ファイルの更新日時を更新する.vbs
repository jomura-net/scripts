set iTunesApp = WScript.CreateObject("iTunes.Application")

' Check if the library exists.
musicExist = 0
for each PlaySource in iTunesApp.Sources
  if PlaySource.Kind = CInt(1) then
    set pMusicList = PlaySource.Playlists.Item(1).Tracks
    musicExist = 1
  end if
next

if musicExist = 0 then
  WScript.Echo "No MusicLibrary exist."
  WScript.Quit 1
end if

Set fso = WScript.CreateObject("Scripting.FileSystemObject")
Set shellAppo = WScript.CreateObject("Shell.Application")
countChanged = 0

' loop each track
for each song in pMusicList
  Set fileo = fso.GetFile(song.Location)
  if not song.DateAdded = fileo.DateLastModified Then
    ' change lastModified
    Set oFolder = shellAppo.Namespace(fileo.ParentFolder & "\")
    Set oFolderItem = oFolder.ParseName(fileo.Name)
    oFolderItem.ModifyDate = song.DateAdded
    countChanged = countChanged + 1
    ' log the changed track
    WScript.StdOut.Write      song.Location       & " , "
    WScript.StdOut.Write      song.DateAdded
    WScript.StdOut.WriteLine
  End if

next

' count changed tracks.
WScript.StdOut.WriteLine "changed tracks : " & countChanged & " of " & pMusicList.Count

iTunesApp.Quit

WScript.Echo "end normally."
