// ==UserScript==
// @name         bili international download
// @version      0.5.6
// @description  download json subtitle from biliintl
// @author       AdvMaple
// @match        /\:\/\/.*.bili.*\/play\/.*$/
// @include      /\:\/\/.*.bili.*\/play\/.*$/
// @icon         https://www.google.com/s2/favicons?domain=biliintl.com
// @updateURL    https://github.com/AdvMaple/biliintl_subtitle_download_plugin/raw/main/download.user.js
// @grant        GM_addStyle
// @require      http://code.jquery.com/jquery-3.6.0.min.js

// ==/UserScript==

/*
CHANGE SUB_LANGUAGE to:
"en" for English
"th" สำหรับภาษาไทย
"zh-Hans" 中國人
"vi" cho người việt nam
"id" untuk Bahasa Indonesia
*/

// Script start here
(function () {
  // Create download sub button
  let sorted = 0;
  let cond1 = false;
  let cond2 = false;
  let sub_language = localStorage.getItem("SUB_LANGUAGE");
  let sub_format = localStorage.getItem("SUB_FORMAT");
  if (!sub_language) {
    localStorage.setItem("SUB_LANGUAGE", "th");
    sub_language = 'th';
  }
  if (!sub_format) {
    localStorage.setItem("SUB_FORMAT", "srt");
    sub_format = 'srt';
  }
  console.log(sub_language);
  console.log(sub_format);
  function createSelectOption() {
    return `
      <option value="vi" ${sub_language === "vi" ? "selected" : ""
      }> Tiếng Việt </option>
      <option value="id" ${sub_language === "id" ? "selected" : ""
      }> Bahasa Indonesia </option>
      <option value="en" ${sub_language === "en" ? "selected" : ""
      }> English </option>
      <option value="zh" ${sub_language === "zh-Hans" ? "selected" : ""
      }> 中文（简体） </option>
      <option value="th" ${sub_language === "th" ? "selected" : ""
      }> ภาษาไทย </option>`;
  }

  function createSubFormatOptions() {
    return `
      <option value="json" ${sub_format === "json" ? "selected" : ""
      }> JSON </option>
      <option value="srt" ${sub_format === "srt" ? "selected" : ""
      }> SRT </option>
      <option value="vtt" ${sub_format === "vtt" ? "selected" : ""
      }> Web VTT </option>`;
  }

  /**
   * Convert second to time stamp
   * @param {*} sec 
   */
  function secToTimer(sec) {
    let o = new Date(0);
    let p = new Date(sec * 1000);
    return new Date(p.getTime() - o.getTime())
      .toISOString()
      .split("T")[1]
      .split("Z")[0];
  }

  let zNode = document.createElement("div");

  zNode.innerHTML = `
    <button id="subtitleDownload" type="button"> Generate Links </button>

    <select id="changeLanguage" class="subtitleSelect" name="lang">
      ${createSelectOption()}
    </select>
    <select id="changeSubFormat" class="subtitleSelect" name="lang-format">
      ${createSubFormatOptions()}
    </select>

    <div class="linkContainer" id="jsonSubtitleList">Subtitle:\&nbsp;</div>
    <div class="linkContainer" id="videoList" >Video\&nbsp;\&nbsp;\&nbsp;:\&nbsp;</div>
    <div class="linkContainer" id="audioList" >Audio\&nbsp;\&nbsp;\&nbsp;:\&nbsp;</div>
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

  document
    .getElementById("changeSubFormat")
    .addEventListener("change", changeSubFormat, false);

  //When downloadSubtitle is click:
  function SubtitleDownloadAction(zEvent) {
    // Reset
    document.getElementById("jsonSubtitleList").innerHTML = 'Subtitle:\&nbsp;';
    document.getElementById("videoList").innerHTML = 'Video\&nbsp;\&nbsp;\&nbsp;:\&nbsp;';
    document.getElementById("audioList").innerHTML = 'Audio\&nbsp;\&nbsp;\&nbsp;:\&nbsp;';
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
      let text = title_list[i].innerText.match(/^([\w\-]+)/);
      try {
        ep_obj.title.push(text[0]);
      } catch (error) {
        ep_obj.title.push(i + 1);
      }
    }
    // console.log(ep_obj.title);

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
                  let blob;
                  let text = "";
                  // Generate SRT and Web VTT format
                  if (sub_format === 'vtt' || sub_format === 'srt') {
                    if (sub_format === 'vtt') {
                      text += `WEBVTT\nKind: captions\nLanguage: ${sub_language}\n\n`
                    }
                    // Map body
                    d.body.forEach((item, index) => {
                      // Get start time
                      const from = secToTimer(item.from !== undefined ? item.from : 0);
                      // Get end time
                      const to = secToTimer(item.to);
                      // Line
                      text += index + 1 + "\n";
                      // Time
                      text += `${from.replace(".", ",")} --> ${to.replace(".", ",")}\n`;
                      // Content
                      text += item.content + "\n\n";
                    });
                    blob = new Blob([text], {
                      type: "text/plain",
                    });
                  } else { // Generate JSON format
                    blob = new Blob([JSON.stringify(d)], {
                      type: "application/json",
                    });
                  }
                  //Create <a> tag
                  var a = document.createElement("a");
                  a.download = `${div_content}-ep-${ep_obj.title[index]}-${sub_language}.${sub_format}`;
                  a.textContent = `${getEpTitle(ep_obj.title[index])} `;
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
      zNode.innerHTML =
        '<button id="mySortBtn" type="button" style=""> Sort </button>';

      document.getElementById("downloadBiliintScript").appendChild(zNode);
      document
        .getElementById("mySortBtn")
        .addEventListener("click", ButtonSortClick, false);
    }
  }

  function ButtonSortClick(zEvent) {
    var sort_by_num = function (a, b) {
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

  function changeSubFormat(e) {
    localStorage.setItem("SUB_FORMAT", e.target.value);
    sub_format = e.target.value;
  }

  function getEpTitle(title) {
    console.log(title);
    if (title === null) {
      return "1";
    }
    return title;
  }

  console.log("From AdvMaple");

  // Style newly added button
  GM_addStyle(`

  #downloadBiliintScript {
      position: fixed; 
      bottom: 6rem;
      left: 1rem;
      margin: 3px;
      z-index: 9999;
      opacity: 0.97;
  }

  .linkContainer{
    color: black;
    background: white;
    opacity: 0.97;
    margin: 2px;
    border-radius: 20px;
    padding: 4px;
    font-size: 15px
  }

  #subtitleDownload {
    cursor: pointer;
    padding: 3px;
    margin-bottom: 3px;
    opacity:0.97;
    border-radius: 20px;
    padding: 8px;
  }

  #subtitleDownload:hover {
    background-color: #6b9f25;
    color: white;
  }

  #BtnContainer{
    margin-top: 3px;
    margin-bottom: 6px;
    opacity: 0.97;
  }
  
  #mySortBtn {
    cursor: pointer;
    padding: 3px;
    border-radius:20px;
    width: 100%;
    background-color: #23427f;
    color: white;
    opacity: 0.99;
  }
  #mySortBtn:hover {
    background-color: #38548b;
    color: #d3d9e5;
  }

  #downloadBiliintScript a {
      color: #4c93ff;
      background: white;
      opacity: 0.97;
  }

  #downloadBiliintScript a:hover {
    color: #4078cb;
    background: white;
    opacity: 0.97;
  }

  .subtitleSelect {
    margin-top: 3px;
    margin-bottom: 6px;
    border-radius: 20px;
    padding: 8px;
    background: white;
    opacity: 0.97;
  }
`);
})();
