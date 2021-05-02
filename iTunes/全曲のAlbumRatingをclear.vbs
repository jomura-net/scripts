set iTunesApp = WScript.CreateObject("iTunes.Application")

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
  
for each song in pMusicList
  song.AlbumRating = 0
next

WScript.Echo "end normally."
