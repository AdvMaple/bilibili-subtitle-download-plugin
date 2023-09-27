// ==UserScript==
// @name         bili international download
// @version      0.5.12
// @description  download json subtitle from biliintl
// @author       AdvMaple
// @match        /\:\/\/.*.bili.*\/play\/.*$/
// @include      /\:\/\/.*.bili.*\/play\/.*$/
// @icon         https://www.google.com/s2/favicons?domain=biliintl.com
// @updateURL    https://github.com/AdvMaple/biliint.com-bilibili.tv_subtitle_download_plugin/raw/main/download.user.js
// @grant        GM_addStyle
// @require      http://code.jquery.com/jquery-3.6.0.min.js

// ==/UserScript==

/*
CHANGE SUB_LANGUAGE to:
"en" for English
"th" สำหรับภาษาไทย
"zh-Hans" 为简体中文
"vi" cho người việt nam
"id" untuk Bahasa Indonesia
"ms" untuk Bahasa Melayu
*/

// Script start here
(function () {
  const USER_OPTIONS = {
    sub_language: "vi",
    sub_format: "srt"
  };

  const LANGS = {
    en: {
      gen_this_link: "Generate Links for this EP",
      gen_links: "Generate Links",
      subtitle: "Subtitle",
      video: "Video",
      audio: "Audio"
    },
    th: {
      gen_this_link: "สร้างการดาวน์โหลดสำหรับ EP นี้",
      gen_links: "สร้างการดาวน์โหลด",
      subtitle: "คำบรรยาย",
      video: "วิดีโอ",
      audio: "เสียง"
    }
  };

  // Create download sub button
  let sorted = 0;
  let cond1 = false;
  let cond2 = false;
  let sub_language = localStorage.getItem("SUB_LANGUAGE");
  let sub_format = localStorage.getItem("SUB_FORMAT");
  let selectedQuality = localStorage.getItem("VIDEO_QUALITY");
  if (!sub_language) {
    localStorage.setItem("SUB_LANGUAGE", USER_OPTIONS.sub_language);
    sub_language = USER_OPTIONS.sub_language;
  }
  if (!sub_format) {
    localStorage.setItem("SUB_FORMAT", USER_OPTIONS.sub_format);
    sub_format = USER_OPTIONS.sub_format;
  }
  if (!selectedQuality) {
    localStorage.setItem("VIDEO_QUALITY", "112");
    selectedQuality = "112";
  }
  const pathnameArr = location.pathname.split("/");
  let appLang = pathnameArr[1];
  if (!["en", "th"].includes(appLang)) {
    appLang = "en";
  }
  let thisEpId, seriesId;
  if (pathnameArr.length === 5) {
    thisEpId = pathnameArr[pathnameArr.length - 1];
    seriesId = pathnameArr[pathnameArr.length - 2];
  } else {
    seriesId = pathnameArr[pathnameArr.length - 1];
  }

  console.log(sub_language);
  console.log(sub_format);
  function createSelectOption() {
    return `
      <option value="vi" ${
        sub_language === "vi" ? "selected" : ""
      }> Tiếng Việt </option>
      <option value="id" ${
        sub_language === "id" ? "selected" : ""
      }> Bahasa Indonesia </option>
      <option value="en" ${
        sub_language === "en" ? "selected" : ""
      }> English </option>
      <option value="zh-Hans" ${
        sub_language === "zh-Hans" ? "selected" : ""
      }> 中文（简体） </option>
      <option value="th" ${
        sub_language === "th" ? "selected" : ""
      }> ภาษาไทย </option>
      <option value="ms" ${
        sub_language === "ms" ? "selected" : ""
      }> Bahasa Melayu </option>`;
  }

  function createSubFormatOptions() {
    return `
      <option value="json" ${
        sub_format === "json" ? "selected" : ""
      }> JSON </option>
      <option value="srt" ${
        sub_format === "srt" ? "selected" : ""
      }> SRT </option>
      <option value="vtt" ${
        sub_format === "vtt" ? "selected" : ""
      }> Web VTT </option>`;
  }

  function createQualityOptions(options) {
    const qualities = options || [
      {
        label: "4K",
        value: 120
      },
      {
        label: "4K",
        value: 112
      },
      {
        label: "4K",
        value: 64
      },
      {
        label: "4K",
        value: 32
      },
      {
        label: "4K",
        value: 16
      }
    ];
    let el = "";
    qualities.forEach((item) => {
      el += `<option value="${item.value}" ${
        selectedQuality === `${item.value}` ? "selected" : ""
      }> ${item.label} </option>`;
    });
    return el;
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

  /**
   * Create vodeo link and append to element
   * @param {*} url
   * @param {*} title
   */
  function createVideoElement(url, title) {
    const a = document.createElement("a");
    // a.textContent = ` [${maxVideoQuality}]${title} `;
    a.textContent = title;
    // a.textContent = `VID `;
    a.href = url;
    a.download = "episode_url";
    a.type = "video/mp4";

    document.getElementById("videoList").appendChild(a);
  }

  let zNode = document.createElement("div");

  // <button id="subtitleDownload" class="btn" type="button"> ${LANGS[appLang].gen_links} </button>
  zNode.innerHTML = `
    <div id="gen-sigle">
      <button id="down-this" class="btn" type="button"> ${
        LANGS[appLang].gen_this_link
      } </button>
    </div>


    <select id="changeLanguage" class="subtitleSelect" name="lang">
      ${createSelectOption()}
    </select>
    <select id="changeSubFormat" class="subtitleSelect" name="lang-format">
      ${createSubFormatOptions()}
    </select>
    <select id="changeQuality" class="subtitleSelect" name="quality">

    </select>

    <div class="linkContainer" id="jsonSubtitleList">${
      LANGS[appLang].subtitle
    }\&nbsp;:\&nbsp;</div>
    <div class="linkContainer" id="videoList" >${
      LANGS[appLang].video
    }\&nbsp;:\&nbsp;</div>
    <div class="linkContainer" id="audioList" >${
      LANGS[appLang].audio
    }\&nbsp;:\&nbsp;</div>
    <div id="snackbar"></div>
    `;

  zNode.setAttribute("id", "downloadBiliintScript");
  document.body.appendChild(zNode);

  function _generateQualities(epId) {
    fetch(
      `https://api.bilibili.tv/intl/gateway/web/playurl?ep_id=${epId}&device=wap&platform=web&qn=64&tf=0&type=0`,
      { credentials: "include" }
    )
      .then((r) => r.json())
      .then(({ data }) => {
        const d = data.playurl;
        const qualities = d.video
          .filter((item) => !!item.video_resource.url)
          .map((item) => ({
            value: item.video_resource.quality,
            label: item.stream_info.desc_words
          }));
        const options = createQualityOptions(qualities);
        document.getElementById("changeQuality").innerHTML = options;
      });
  }

  if (!thisEpId) {
    fetch(
      `https://api.bilibili.tv/intl/gateway/web/v2/ogv/play/episodes?platform=web&season_id=${seriesId}`,
      { credentials: "include" }
    )
      .then((r) => r.json())
      .then(({ data }) => {
        if (data?.sections?.length > 0) {
          const eps = data?.sections[0].episodes;
          if (eps.length > 0) {
            const epId = eps[0].episode_id;
            _generateQualities(epId);
          }
        }
      });
  } else {
    _generateQualities(thisEpId);
  }

  /*
  <div id="downloadBiliintScript">
    <button id="subtitleDownload" type="button"> Download Sub </button>
  </div>


    Not yet added
    <button> Download Video </button>
    <button> Download Audio </button>

  */

  // document
  //   .getElementById("subtitleDownload")
  //   .addEventListener("click", SubtitleDownloadAction, false);

  document
    .getElementById("down-this")
    .addEventListener("click", downloadThisEp, false);

  document
    .getElementById("changeLanguage")
    .addEventListener("change", ChangeLanguage, false);

  document
    .getElementById("changeSubFormat")
    .addEventListener("change", changeSubFormat, false);

  document
    .getElementById("changeQuality")
    .addEventListener("change", changeQuality, false);

  function isJsonString(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  const isAssSubtitleFile = (str) => {
    return str.includes("[V4+ Styles]");
  };

  const procressSubtitleArrayFromServer = async (
    ep_sub_url,
    ep_id,
    title,
    epTitle,
    thisEp
  ) => {
    const r = await fetch(ep_sub_url);
    console.log(r);
    const rText = await r.text();
    if (!isJsonString(rText)) {
      if (isAssSubtitleFile(rText)) {
        // if mismatch the setting and the download file => show toast
        showToast(
          "The server is returning ass file. The generated link is .ass file"
        );

        const blob = new Blob([rText], {
          type: "text/plain"
        });
        makeAnkerTag("ass", title, epTitle, thisEp, blob);
      } else {
        alert("Server is returning wrong => contact dev :)");
      }
    } else {
      const d = JSON.parse(rText);
      let blob;
      let text = "";
      // Generate SRT and Web VTT format
      if (sub_format === "vtt" || sub_format === "srt") {
        if (sub_format === "vtt") {
          text += `WEBVTT\nKind: captions\nLanguage: ${sub_language}\n\n`;
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
          type: "text/plain"
        });
      } else {
        // Generate JSON format
        blob = new Blob([JSON.stringify(d)], {
          type: "application/json"
        });
      }
      //Create <a> tag
      makeAnkerTag(sub_format, title, epTitle, thisEp, blob);
    }
  };

  async function generateSubtitle(ep_id, title, epTitle, thisEp) {
    const FETCH_URL = `https://api.bilibili.tv/intl/gateway/web/v2/subtitle?s_locale=vi_VN&platform=web&episode_id=${ep_id}&spm_id=bstar-web.pgc-video-detail.0.0&from_spm_id=bstar-web.homepage.top-list.all`;
    const r = await fetch(FETCH_URL, { credentials: "include" });
    const rText = await r.text();
    if (!isJsonString(rText)) {
      console.log(rText);
      alert("Server is returning wrong => contact dev :)");
    } else {
      const { data } = JSON.parse(rText);
      if (data.subtitles === null)
        alert("There has been some problems, please contract dev");
      //Take data in response
      //Get number in subtitle files in data
      for (let i = 0; i < data.subtitles.length; i++) {
        if (data.subtitles[i]["lang_key"] == sub_language) {
          const ep_sub_url = data.subtitles[i].url;
          procressSubtitleArrayFromServer(
            ep_sub_url,
            ep_id,
            title,
            epTitle,
            thisEp
          );
        }
      }
    }
  }

  const makeAnkerTag = (sub_format, title, epTitle, thisEp, blob) => {
    let a = document.createElement("a");
    a.download = !epTitle
      ? `${title}-${sub_language}.${sub_format}`
      : `${title}-ep-${epTitle}-${sub_language}.${sub_format}`;
    a.textContent = thisEp ? title : `${getEpTitle(epTitle)} `;
    a.href = URL.createObjectURL(blob);
    document.getElementById("jsonSubtitleList").appendChild(a);
    // <a download="{animeName} ep {title}.json" href={URL.createObjectURL(blob)}> {title}</a>
  };

  /**
   * Genearate video ep
   * @param {*} ep_id
   * @param {string} title
   */
  function generateEpElement(ep_id, title) {
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
        let episode_url = "";
        const userSelectedQuality = Number(selectedQuality);
        const vidIndex = d.video.findIndex(
          (item) => item.video_resource.quality === userSelectedQuality
        );
        let runLoop = false;
        if (vidIndex > -1) {
          const videoUrl = d.video[vidIndex].video_resource.url;
          if (videoUrl) {
            createVideoElement(videoUrl, `${title} `);
          } else {
            runLoop = true;
          }
        } else {
          runLoop = true;
        }

        if (runLoop) {
          //VIDEO LOOP
          for (let i = 0; i < d.video.length; i++) {
            episode_url = d.video[i]["video_resource"].url;
            if (episode_url !== "") {
              if (maxVideoQuality < d.video[i]["video_resource"].quality) {
                maxVideoQuality = d.video[i]["video_resource"].quality;

                createVideoElement(episode_url, `${title} `);
              }
            }
          }
        }

        //AUDIO LOOP

        for (let i = 0; i < d["audio_resource"].length; i++) {
          const audio_url = d["audio_resource"][i].url;
          if (audio_url !== "") {
            if (maxAudioQuality < d["audio_resource"][i].quality) {
              maxAudioQuality = d["audio_resource"][i].quality;

              var a = document.createElement("a");
              a.textContent = `${title} `;
              // a.textContent = `AUDIO`;
              // a.textContent = ` [${maxAudioQuality}]${title}`;
              a.href = audio_url;
              a.download = "audio_url";
              a.type = "video/mp4";

              document.getElementById("audioList").appendChild(a);
            }
          }
        }
      });
  }

  function generateCurrentEpisodeElement() {
    const title = document.title;
    let thisEpId;
    const pathnameArr = location.pathname.split("/");
    if (pathnameArr.length === 5) {
      thisEpId = pathnameArr[pathnameArr.length - 1];
    } else {
      alert("Please choose an episode first to have episode ID");
    }
    if (thisEpId) {
      generateSubtitle(thisEpId, title, null, true);
      generateEpElement(thisEpId, title);
    } else {
      const classes = document.getElementsByClassName("panel-item__active");
      if (classes.length > 0) {
        const link = classes[0].firstChild;
        if (link.href) {
          const arr = link.href.split("/");
          const epId = arr[arr.length - 1];
          generateSubtitle(epId, title, null, true);
          generateEpElement(epId, title);
        }
      }
    }
  }

  function resetContent() {
    document.getElementById(
      "jsonSubtitleList"
    ).innerHTML = `${LANGS[appLang].subtitle}\&nbsp;:\&nbsp;`;
    document.getElementById(
      "videoList"
    ).innerHTML = `${LANGS[appLang].video}\&nbsp;:\&nbsp;`;
    document.getElementById(
      "audioList"
    ).innerHTML = `${LANGS[appLang].audio}\&nbsp;:\&nbsp;`;
  }

  //When downloadSubtitle is click:
  function SubtitleDownloadAction(zEvent) {
    // Reset
    resetContent();
    //Get series id
    let id = window.location.href.match(/\d+/g); // Get all number in url
    let div_content =
      document.getElementsByClassName("video-info__title")[0].innerText;
    let series_id = id[0];
    // var ep_id = id[1]; //There can be episode id in the title
    cond1 = cond2 = false;
    let ep_obj = {
      id: [],
      title: []
    };
    const ep_list = document.getElementsByClassName("select-ep__panel")[0];
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
      generateSubtitle(ep_id, div_content, ep_obj.title[index]);
      //Get list of video and audio in episode
      generateEpElement(ep_id, ep_obj.title[index]);
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

  function downloadThisEp(e) {
    // Reset
    resetContent();

    generateCurrentEpisodeElement();
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

  function changeQuality(e) {
    localStorage.setItem("VIDEO_QUALITY", e.target.value);
    selectedQuality = e.target.value;
  }

  function getEpTitle(title) {
    console.log(title);
    if (title === null) {
      return "1";
    }
    return title;
  }

  function showToast(message) {
    const x = document.getElementById("snackbar");
    x.className = "show";
    x.innerText = message;
    setTimeout(function () {
      x.className = x.className.replace("show", "");
    }, 3000);
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

  .btn {
    cursor: pointer;
    padding: 3px;
    margin-bottom: 3px;
    opacity:0.97;
    border-radius: 20px;
    padding: 8px;
  }

  .btn:hover {
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
  #snackbar {
  visibility: hidden;
  min-width: 250px;
  margin-left: -125px;
  background-color: #333;
  color: #fff;
  text-align: center;
  border-radius: 2px;
  padding: 16px;
  position: fixed;
  z-index: 1;
  left: 50%;
  bottom: 30px;
  font-size: 17px;
}

#snackbar.show {
  visibility: visible;
  -webkit-animation: fadein 0.5s, fadeout 0.5s 2.5s;
  animation: fadein 0.5s, fadeout 0.5s 2.5s;
}

@-webkit-keyframes fadein {
  from {bottom: 0; opacity: 0;}
  to {bottom: 30px; opacity: 1;}
}

@keyframes fadein {
  from {bottom: 0; opacity: 0;}
  to {bottom: 30px; opacity: 1;}
}

@-webkit-keyframes fadeout {
  from {bottom: 30px; opacity: 1;}
  to {bottom: 0; opacity: 0;}
}

@keyframes fadeout {
  from {bottom: 30px; opacity: 1;}
  to {bottom: 0; opacity: 0;}
}
`);
})();
