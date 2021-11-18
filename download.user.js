// ==UserScript==
// @name         bili international download
// @version      0.5.4
// @description  download json subtitle from biliintl
// @author       AdvMaple
// @match        www.bili*
// @include      /www.bili*/
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

// Script start here
(function () {
  // Create download sub button
  let sorted = 0;
  let cond1 = false;
  let cond2 = false;
  let sub_language = localStorage.getItem("SUB_LANGUAGE");
  console.log(sub_language);
  if (sub_language === null) {
    localStorage.setItem("SUB_LANGUAGE", "vi");
  }

  function createSelectOption() {
    return `
      <option value="vi" ${
        sub_language === "vi" ? "selected" : ""
      }> Vietnam </option>
      <option value="id" ${
        sub_language === "id" ? "selected" : ""
      }> Indo </option>
      <option value="en" ${
        sub_language === "en" ? "selected" : ""
      }> English </option>
      <option value="zh" ${
        sub_language === "zh" ? "selected" : ""
      }> Hans </option>
      <option value="th" ${
        sub_language === "th" ? "selected" : ""
      }> Thai </option>`;
  }

  let zNode = document.createElement("div");

  zNode.innerHTML = `
    <button id="subtitleDownload" type="button"> Download Sub </button>

    <select id="changeLanguage" class="subtitleSelect" name="lang" id="lang">
      ${createSelectOption()}
    </select>

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

  document
    .getElementById("changeLanguage")
    .addEventListener("change", ChangeLanguage, false);

  //When downloadSubtitle is click:
  function SubtitleDownloadAction(zEvent) {
    //Get series id
    let id = window.location.href.match(/\d+/g); // Get all number in url
    let div_content =
      document.getElementsByClassName("video-info__title")[0].innerText;
    let series_id = id[0];
    // var ep_id = id[1]; //There can be episode id in the title
    cond1 = cond2 = false;
    let ep_obj = {
      id: [],
      title: [],
    };
    const ep_list = document.getElementsByClassName("video-episodes__panel")[0];
    const a_list = ep_list.getElementsByTagName("a");
    const title_list = ep_list.getElementsByClassName(
      "across-card__info_title"
    );

    // Get ep_id
    for (let i = 0; i < a_list.length; i++) {
      ep_obj.id.push(a_list[i].pathname.match(/\d+/g)[1]);
    }

    for (let i = 0; i < title_list.length; i++) {
      let text = title_list[i].innerText.match(/^([\w\-]+)/)[0];
      ep_obj.title.push(text);
    }
    console.log(ep_obj.title);

    ep_obj.id.map((ep_id, index) => {
      // console.log(ep_id, ep_obj.title[index]);
      // Get list of subtitle in episode
      fetch(`https://api.bilibili.tv/intl/gateway/m/subtitle?ep_id=${ep_id}`)
        .then((r) => r.json())
        .then(({ data }) => {
          //Take data in response
          //Get number in subtitle files in data
          for (let i = 0; i < data.subtitles.length; i++) {
            if (data.subtitles[i].key == sub_language) {
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
                  a.download = `${div_content}-ep-${ep_obj.title[index]}-${sub_language}.json`;
                  a.textContent = `${ep_obj.title[index]} `;
                  // a.download = `sub.json`;
                  // a.textContent = `title`;
                  a.href = URL.createObjectURL(blob);
                  document.getElementById("jsonSubtitleList").appendChild(a);
                  // <a download="{animeName} ep {title}.json" href={URL.createObjectURL(blob)}> {title}</a>
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
                a.textContent = `${ep_obj.title[index]} `;
                // a.textContent = `VID `;
                a.href = episode_url;
                a.download = "episode_url";
                a.type = "video/mp4";

                document.getElementById("videoList").appendChild(a);
              }
            }
          }
          //AUDIO LOOP

          for (let i = 0; i < d["audio_resource"].length; i++) {
            audio_url = d["audio_resource"][i].url;
            if (episode_url !== "") {
              if (maxAudioQuality < d["audio_resource"][i].quality) {
                maxAudioQuality = d["audio_resource"][i].quality;

                var a = document.createElement("a");
                a.textContent = `${ep_obj.title[index]} `;
                // a.textContent = `AUDIO`;
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

    if (sorted == 0) {
      console.log(sorted == 0);
      sorted = 1;
      var zNode = document.createElement("div");
      zNode.setAttribute("id", "BtnContainer");
      zNode.innerHTML = '<button id="mySortBtn" type="button"> Sort </button>';
      document.getElementById("downloadBiliintScript").appendChild(zNode);
      document
        .getElementById("mySortBtn")
        .addEventListener("click", ButtonSortClick, false);
    }
  }

  function ButtonSortClick(zEvent) {
    var sort_by_num = function (a, b) {
      console.log(a, b);
      return (
        Number(a.innerText.match(/\d+/g)[0]) -
        Number(b.innerText.match(/\d+/g)[0])
      );
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

  function ChangeLanguage(e) {
    localStorage.setItem("SUB_LANGUAGE", e.target.value);
    sub_language = e.target.value;
  }

  console.log("From  AdvMaple");

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
  .subtitleSelect {
    margin-top: 3px;
    margin-bottom: 6px;
    padding: 3px;
    background:             white;
  }
`);
})();
