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
  const DEFAULT_USER_OPTIONS = {
    sub_language: "en",
    sub_format: "srt",
    video_quality: 112,
    video_codec: 12
  };

  const VIDEO_CODECS = [
    {
      id: 7,
      label: "AVC"
    },
    {
      id: 12,
      label: "HEVC"
    }
  ];

  const VIDEO_QUALITIES = [
    {
      id: 120,
      label: "4K"
    },
    {
      id: 112,
      label: "1080P(HD)"
    },
    {
      id: 80,
      label: "1080P"
    },
    {
      id: 64,
      label: "720P"
    },
    {
      id: 32,
      label: "480P"
    },
    {
      id: 16,
      label: "320P"
    },
    {
      id: 6,
      label: "240P"
    },
    {
      id: 5,
      label: "144P"
    }
  ];

  const APP_LANGUAGES = {
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

  let sub_language = localStorage.getItem("SUB_LANGUAGE");
  if (!sub_language) {
    localStorage.setItem("SUB_LANGUAGE", DEFAULT_USER_OPTIONS.sub_language);
    sub_language = DEFAULT_USER_OPTIONS.sub_language;
  }

  let sub_format = localStorage.getItem("SUB_FORMAT");
  if (!sub_format) {
    localStorage.setItem("SUB_FORMAT", DEFAULT_USER_OPTIONS.sub_format);
    sub_format = DEFAULT_USER_OPTIONS.sub_format;
  }

  let selectedQuality = localStorage.getItem("VIDEO_QUALITY");
  if (!selectedQuality) {
    localStorage.setItem("VIDEO_QUALITY", DEFAULT_USER_OPTIONS.video_quality);
    selectedQuality = DEFAULT_USER_OPTIONS.video_quality;
  }

  let selectedCodec = localStorage.getItem("VIDEO_CODEC");
  if (!selectedCodec) {
    localStorage.setItem("VIDEO_CODEC", DEFAULT_USER_OPTIONS.video_codec);
    selectedCodec = DEFAULT_USER_OPTIONS.video_codec;
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
      <option value="ass" ${
        sub_format === "ass" ? "selected" : ""
      }> ASS </option>
      <option value="srt" ${
        sub_format === "srt" ? "selected" : ""
      }> SRT </option>
      <option value="vtt" ${
        sub_format === "vtt" ? "selected" : ""
      }> Web VTT </option>
      <option value="json" ${
        sub_format === "json" ? "selected" : ""
      }> JSON </option>
    `;
  }

  function createQualityOptions(options) {
    const _getCodecLabel = (codecId) => {
      const matchedCodec =
        VIDEO_CODECS.find((item) => item.id === codecId) || {};
      return matchedCodec.label || "Unknown Codec";
    };

    const _sortBy =
      (keyName = "") =>
      (a, b) => {
        if (a[keyName] < b[keyName]) {
          return 1;
        } else if (a[keyName] > b[keyName]) {
          return -1;
        }

        return 0;
      };

    const qualities = options || VIDEO_QUALITIES;

    let el = "";
    qualities
      .sort(_sortBy("codec_id"))
      .sort(_sortBy("id"))
      .forEach((item) => {
        el += `<option value="${item.id};${item.codec_id}" ${
          selectedQuality === `${item.id}` &&
          selectedCodec === `${item.codec_id}`
            ? "selected"
            : ""
        }>[${_getCodecLabel(item.codec_id)}] ${item.label} </option>`;
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
   * Create video link and append to element
   * @param {*} url
   * @param {*} title
   */
  function createVideoElement(url, title) {
    const a = document.createElement("a");
    a.textContent = title;
    a.href = url;
    a.download = "episode_url";
    a.type = "video/mp4";

    document.getElementById("videoList").appendChild(a);
  }

  let zNode = document.createElement("div");
  zNode.innerHTML = `
    <div id="gen-sigle">
      <button id="down-this" class="btn" type="button"> ${
        APP_LANGUAGES[appLang].gen_this_link
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
      APP_LANGUAGES[appLang].subtitle
    }\&nbsp;:\&nbsp;</div>

    <div class="linkContainer" id="videoList" >${
      APP_LANGUAGES[appLang].video
    }\&nbsp;:\&nbsp;</div>

    <div class="linkContainer" id="audioList" >${
      APP_LANGUAGES[appLang].audio
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
            codec_id: item.video_resource.codec_id,
            id: item.video_resource.quality,
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

  document
    .getElementById("down-this")
    .addEventListener("click", downloadThisEp, false);

  document
    .getElementById("changeLanguage")
    .addEventListener("change", changeLanguage, false);

  document
    .getElementById("changeSubFormat")
    .addEventListener("change", changeSubFormat, false);

  document
    .getElementById("changeQuality")
    .addEventListener("change", changeQuality, false);

  const isJsonString = (str) => {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  };

  const processSubtitleArrayFromServer = async (
    ep_sub_url,
    ep_id,
    title,
    epTitle,
    thisEp
  ) => {
    const _isAssSubtitleFile = (str) => str.includes("[V4+ Styles]");

    const r = await fetch(ep_sub_url);
    const rText = await r.text();

    let dataFormatName = "unknown format";
    if (!isJsonString(rText)) {
      if (_isAssSubtitleFile(rText)) {
        dataFormatName = "ass";

        const blob = new Blob([rText], {
          type: "text/plain"
        });
        makeAnkerTag("ass", title, epTitle, thisEp, blob);
      } else {
        alert("Server is returning wrong => contact dev :)");
      }
    } else {
      dataFormatName = "json";

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
          type: `text/${sub_format === "srt" ? "plain" : "vtt"}`
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

    // if mismatch the setting and the download file => show toast
    showToast(
      `The server is returning ${dataFormatName} file. The generated link is .${sub_format} file`
    );
  };

  const makeAnkerTag = (sub_format, title, epTitle, thisEp, blob) => {
    const _getEpTitle = (str) => (str === null ? "1" : str);

    let a = document.createElement("a");
    a.download = !epTitle
      ? `${title}-${sub_language}.${sub_format}`
      : `${title}-ep-${epTitle}-${sub_language}.${sub_format}`;
    a.textContent = thisEp ? title : `${_getEpTitle(epTitle)} `;
    a.href = URL.createObjectURL(blob);
    document.getElementById("jsonSubtitleList").appendChild(a);
  };

  async function generateSubtitle(ep_id, title, epTitle, thisEp) {
    const FETCH_URL = `https://api.bilibili.tv/intl/gateway/web/v2/subtitle?s_locale=vi_VN&platform=web&episode_id=${ep_id}&spm_id=bstar-web.pgc-video-detail.0.0&from_spm_id=bstar-web.homepage.top-list.all`;

    const r = await fetch(FETCH_URL, { credentials: "include" });
    const rText = await r.text();

    if (!isJsonString(rText)) {
      alert("Server is returning wrong => contact dev :)");
    } else {
      const { data } = JSON.parse(rText);
      if (data.subtitles === null || data.video_subtitle === null) {
        alert("There has been some problems, please contact dev");
      }

      //Take data in response
      let subtitleData = [];
      if (sub_format === "ass") {
        // ASS only
        subtitleData = data.subtitles || [];
      } else {
        // SRT & others
        subtitleData = data.video_subtitle || [];
      }

      //Get number in subtitle files in data
      for (let i = 0; i < subtitleData.length; i++) {
        if (subtitleData[i]["lang_key"] == sub_language) {
          const ep_sub_url =
            sub_format === "ass"
              ? subtitleData[i].url
              : subtitleData[i].srt.url;

          processSubtitleArrayFromServer(
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

        var maxVideoQuality = 0;
        var maxAudioQuality = 0;
        let episode_url = "";

        const userSelectedQuality = Number(selectedQuality);
        const userSelectedCodec = Number(selectedCodec);

        const vidIndex = d.video.findIndex(
          (item) =>
            item.video_resource.quality === userSelectedQuality &&
            item.video_resource.codec_id === userSelectedCodec
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
    const pathnameArr = location.pathname.split("/");

    let thisEpId;
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
    ).innerHTML = `${APP_LANGUAGES[appLang].subtitle}\&nbsp;:\&nbsp;`;
    document.getElementById(
      "videoList"
    ).innerHTML = `${APP_LANGUAGES[appLang].video}\&nbsp;:\&nbsp;`;
    document.getElementById(
      "audioList"
    ).innerHTML = `${APP_LANGUAGES[appLang].audio}\&nbsp;:\&nbsp;`;
  }

  function downloadThisEp(e) {
    // Reset
    resetContent();

    generateCurrentEpisodeElement();
  }

  function changeLanguage(e) {
    localStorage.setItem("SUB_LANGUAGE", e.target.value);
    sub_language = e.target.value;

    // Re-generate new links
    downloadThisEp();
  }

  function changeSubFormat(e) {
    localStorage.setItem("SUB_FORMAT", e.target.value);
    sub_format = e.target.value;

    // Re-generate new links
    downloadThisEp();
  }

  function changeQuality(e) {
    const values = e.target.value.split(";");

    localStorage.setItem("VIDEO_QUALITY", values[0]);
    selectedQuality = e.target.value;

    localStorage.setItem("VIDEO_CODEC", values[1]);
    selectedCodec = e.target.value;

    // Re-generate new links
    downloadThisEp();
  }

  let toastTimeout;
  function showToast(message) {
    const x = document.getElementById("snackbar");
    x.className = "show";
    x.innerText = message;

    if (toastTimeout) {
      toastTimeout = clearTimeout(toastTimeout);
    }

    toastTimeout = setTimeout(function () {
      x.className = x.className.replace("show", "");
    }, 3000);
  }

  // Style newly added button
  GM_addStyle(`

    #downloadBiliintScript {
      position: fixed;
      bottom: 6rem;
      left: 1rem;
      margin: 3px;
      z-index: 9999;
      opacity: 0.97;
      background: black;
      padding: 16px;
    }

    #down-this {
      background: white;
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
