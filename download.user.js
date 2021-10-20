// ==UserScript==
// @name         bili international download
// @version      0.4.0
// @description  download json subtitle from biliintl
// @author       AdvMaple
// @include        /www.bili*/
// @icon         https://www.google.com/s2/favicons?domain=biliintl.com
// @updateURL    https://github.com/AdvMaple/biliintl_subtitle_download_plugin/raw/main/download.user.js
// @grant        GM_addStyle
// @require      http://code.jquery.com/jquery-3.6.0.min.js

// ==/UserScript==

/*
CHANGE SUB_LANGUAGE to:
"en" for English
"th" for Thai
"zh-Hans" for Chinese
"vi" for Vietnamese
"id" for Bahasa Indonesia
*/

const SUB_LANGUAGE = "vi";


// Script start here
(function () {
  // Create download sub button
  var zNode = document.createElement("div");

  zNode.innerHTML = `
    <button id="subtitleDownload" type="button"> Download Sub </button>
    <div class="linkContainer" id="jsonSubtitleList">Subtitle:</div>
    <div class="linkContainer" id="videoList">Video\&nbsp;\&nbsp;\&nbsp;:</div>
    <div class="linkContainer" id="audioList">Audio\&nbsp;\&nbsp;\&nbsp;:</div>
    `;

  zNode.setAttribute("id", "downloadBiliintScript");
  document.body.appendChild(zNode);

  /*
  <div id="downloadBiliintScript">
    <button id="subtitleDownload" type="button"> Download Sub </button>
  </div>


    Not yet added
    <button> Download Video </button>
    <button> Download Audio </button>
  
  */

  document
    .getElementById("subtitleDownload")
    .addEventListener("click", SubtitleDownloadAction, false);

  //When downloadSubtitle is click:
  function SubtitleDownloadAction(zEvent) {
    try {
      var div_content =
        document.getElementsByClassName("video-info__title")[0].innerText;
    } catch (e) {
      console.log(e);
    }

    //Get series id
    var id = window.location.href.match(/\d+/g); // Get all number in url
    var series_id = id[0];
    var ep_id = id[1]; //There can be episode id in the title

    console.log(window.location.href);
    console.log("series_id", series_id);
    console.log("ep_id", ep_id);

    //Get list of episode in series
    var x;
    fetch(
      `https://api.bilibili.tv/intl/gateway/web/view/ogv_collection?s_locale=vi&season_id=${series_id}`
    )
      .then((r) => r.json())
      .then((data) => (x = data))
      .then(() => {
        var epList = x.data.episodes;

        epList.map((x) => {
          const { title, ep_id } = x;
          console.log(title, ep_id);
          // 1 xxxxxx
          // PV1 xxxxxx

          // Get list of subtitle in episode
          fetch(
            `https://api.bilibili.tv/intl/gateway/m/subtitle?ep_id=${ep_id}`
          )
            .then((r) => r.json())
            .then(({ data }) => {
              //Take data in response
              //Get number in subtitle files in data
              for (let i = 0; i < data.subtitles.length; i++) {
                if (data.subtitles[i].key == SUB_LANGUAGE) {
                  var ep_sub_url = data.subtitles[i].url;
                  fetch(ep_sub_url)
                    .then((r) => r.json())
                    .then((d) => {
                      //Create blob object of json subtitle
                      var blob = new Blob([JSON.stringify(d)], {
                        type: "application/json",
                      });
                      //Create <a> tag
                      var a = document.createElement("a");
                      a.download = `${div_content} ep ${title}.json`;
                      a.textContent = `${title} `;
                      a.href = URL.createObjectURL(blob);
                      document
                        .getElementById("jsonSubtitleList")
                        .appendChild(a);
                      //<a download="{animeName} ep {title}.json" href={URL.createObjectURL(blob)}> {title}</a>
                    });
                  break;
                }
              }
            });

          //Get list of video and audio in episode
          fetch(
            `https://api.bilibili.tv/intl/gateway/web/playurl?ep_id=${ep_id}&device=wap&platform=web&qn=64&tf=0&type=0`,
            { credentials: "include" }
          )
            .then((r) => r.json())
            .then(({ data }) => {
              const d = data.playurl;
              // console.log(title, d);

              const suggestQuality = d.quality;
              var maxVideoQuality = 0;
              var maxAudioQuality = 0;
              //VIDEO LOOP
              for (let i = 0; i < d.video.length; i++) {
                episode_url = d.video[i]["video_resource"].url;
                if (episode_url !== "") {
                  if (maxVideoQuality < d.video[i]["video_resource"].quality) {
                    maxVideoQuality = d.video[i]["video_resource"].quality;

                    var a = document.createElement("a");
                    // a.textContent = ` [${maxVideoQuality}]${title} `;
                    a.textContent = `${title} `;
                    a.href = episode_url;
                    a.download = "episode_url";
                    a.type = "video/mp4";

                    document.getElementById("videoList").appendChild(a);
                  }
                }
              }
              //AUDIO LOOP
              // console.log(title, d["audio_resource"]);
              for (let i = 0; i < d["audio_resource"].length; i++) {
                audio_url = d["audio_resource"][i].url;
                if (episode_url !== "") {
                  if (maxAudioQuality < d["audio_resource"][i].quality) {
                    maxAudioQuality = d["audio_resource"][i].quality;

                    var a = document.createElement("a");
                    a.textContent = `${title} `;
                    // a.textContent = ` [${maxAudioQuality}]${title}`;
                    a.href = audio_url;
                    a.download = "episode_url";
                    a.type = "video/mp4";

                    document.getElementById("audioList").appendChild(a);
                  }
                }
              }
            });
        });
      })
      .then(() => {
        var zNode = document.createElement("div");
        zNode.setAttribute("id", "BtnContainer");
        zNode.innerHTML =
          '<button id="mySortBtn" type="button"> Sort </button>';

        document.getElementById("downloadBiliintScript").appendChild(zNode);

        document
          .getElementById("mySortBtn")
          .addEventListener("click", ButtonSortClick, false);

        function ButtonSortClick(zEvent) {
          var sort_by_num = function (a, b) {
            return a.innerText - b.innerText;
          };

          // var sort_by_num_with_extra_character = function (a, b) {
          //   a.innerText = a.match(/(?<=\])(.*?)(?= )/gm);
          //   b.innerText = b.match(/(?<=\])(.*?)(?= )/gm);
          //   return a.innerText - b.innerText;
          // };

          var list = $("#jsonSubtitleList > a").get();
          // console.log(list);
          list.sort(sort_by_num);
          for (var i = 0; i < list.length; i++) {
            list[i].parentNode.appendChild(list[i]);
          }

          list = $("#videoList > a").get();
          list.sort(sort_by_num);
          for (var i = 0; i < list.length; i++) {
            list[i].parentNode.appendChild(list[i]);
          }

          list = $("#audioList > a").get();
          list.sort(sort_by_num);
          for (var i = 0; i < list.length; i++) {
            list[i].parentNode.appendChild(list[i]);
          }
        }
      });
  }

  console.log("Hello");

  // Style newly added button
  GM_addStyle(`
  #downloadBiliintScript {
      position:               fixed; 
      bottom:                 6rem;
      left: 1rem;
      margin: 3px;
      z-index: 9999;
      
  }
  .linkContainer{
    color: black;
    background: white;
    margin: 2px;
  }
  #subtitleDownload {
    cursor:                 pointer;
    padding: 3px;
    margin-bottom: 3px;
  }

  #subtitleDownload:hover {
    background-color: #4078cb;
    color: white;
  }

  #BtnContainer{
    margin-top: 3px;
    margin-bottom: 6px;
  }
  
  #mySortBtn {
    cursor:                 pointer;
    padding: 3px;
  }
  #mySortBtn:hover {
    background-color: #4078cb;
    color: white;
  }

  #downloadBiliintScript a {
      color:                  red;
      background:             white;
  }
  #downloadBiliintScript a:hover {
    color:                  #4078cb;
    background:             white;
}
`);
})();

