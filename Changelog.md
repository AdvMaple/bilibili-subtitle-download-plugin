# CHANGELOG

> Datetime format: YYYY/MM/DD

## 2024/03/18

- Supported Traditional Chinese language
- Supported `video` with nation code
- Supported `anime` without nation code
- Get the subtitle file based on the language you are selecting for the API

## 2023/12/22

- Supported `video` on bilibili
- Changed the content of the error notification more clearly
- Refactoring the function to get video/episode/season ID
- Refactoring the function to get video quality list

## 2023/10/03

- Fixed an issue where the new file name format did not work properly with different language interfaces
- Fixed UI style
- Automatically create `.srt` subtitle file link if `.ass` subtitles are not available
- Added warning message when `.ass` subtitles are not available and an alternative `.srt` subtitle file link has been created
- Use a warning message instead of an alert when the selected language does not have subtitles
- Updated changlog & readme

## 2023/10/02

- Update the filename format similar to `yt-dlp` (https://github.com/yt-dlp/yt-dlp)
- Fixed `@updateURL` and removed `@require` jquery

## 2023/10/01

- Add some backup methods to take the title of EP/Series to ensure the title always takes the title
- Add new and modify the fallback method to get EP_ID for accuracy
- Customize the subtitle/video/audio file name when downloading
- Optimize the function generate subtitle link (delete unused parameters)
- Check and notify if the language you choose does not support subtitles
- Fixed an error where the .ass subtitle file could not be downloaded when the video did not have .ass subtitles ( [#33](https://github.com/AdvMaple/bilibili-subtitle-download-plugin/issues/33) )

## 2023/09/28

- Fixed UI styles
- Fixed issue can't download srt subtitle
- Fixed issue missing codec names in the video quality selection list
- Auto re-generate new links when change subtitle language/format or video quality
- Code refactor & cleanup

## 2023/03/29

- Update download link for .ass file 🎉🎉 (Bilibili finally support ass for typesetting)
- Add toast message when ass file is generated

## 2022/06/22

- Fix subtitle api url.
- Fix variable key cause api changes.

## 2022/05/03

- Remove list all link button - Bilibili has implement a ddos guard, so I have to disable this for less API calls.

## 2022/01/23

- Add quality selection options
- Add option to download the current episode
