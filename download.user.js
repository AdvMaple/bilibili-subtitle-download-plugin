// ==UserScript==
// @name         Bilibili international subtitle downloader
// @version      0.7.4
// @description  Download subtitle from bilibili.tv
// @author       AdvMaple
// @match        /\:\/\/.*.bili.*\/(play|video)\/.*$/
// @include      /\:\/\/.*.bili.*\/(play|video)\/.*$/
// @icon         https://www.google.com/s2/favicons?domain=biliintl.com
// @updateURL    https://github.com/AdvMaple/bilibili-subtitle-download-plugin/raw/feature/download.user.js
// @grant        GM_addStyle

// ==/UserScript==

// Script start here
(function () {
  const DEFAULT_USER_OPTIONS = {
    sub_language: "en",
    sub_format: "srt",
    video_quality: 112,
    video_codec: 12
  };

  const SUB_LANGUAGES = [
    { id: "en", label: "English" },
    { id: "th", label: "ภาษาไทย" },
    { id: "vi", label: "Tiếng Việt" },
    { id: "id", label: "Bahasa Indonesia" },
    { id: "ms", label: "Bahasa Melayu" },
    { id: "zh-Hans", label: "中文（简体）" },
    { id: "zh-Hant", label: "中文（繁体）" }
  ];

  const SUB_FORMATS = ["ass", "srt", "vtt", "json"];

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

  // Set APP language
  const pathnameArr = location.pathname.split("/");
  let appLang = pathnameArr[1];
  if (!Object.keys(APP_LANGUAGES).includes(appLang)) {
    appLang = "en";
  }

  // Generate video quality list
  const { ep_id, video_id, season_id } = getIds();
  if (ep_id > 0 || season_id > 0 || video_id > 0) {
    // Generate by: ep_id ~> season_id ~> video_id
    generateQualities({ ep_id, season_id, video_id });
  }

  function createSubLanguageOptions() {
    return `${SUB_LANGUAGES.map(
      (item) =>
        `<option value="${item.id}" ${
          sub_language === item.id ? "selected" : ""
        }> ${item.label} </option>`
    )}`;
  }

  function createSubFormatOptions() {
    return `${SUB_FORMATS.map(
      (value) =>
        `<option value="${value}" ${
          sub_format === value ? "selected" : ""
        }> ${value.toUpperCase()} </option>`
    )}`;
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

  // Create video link and append to element
  function createVideoElement({ ep_url, ep_title }) {
    const a = document.createElement("a");
    a.textContent = ep_title;
    a.href = ep_url;
    a.download = `${ep_title}.mp4`;
    a.type = "video/mp4";

    document.getElementById("videoList").appendChild(a);
  }

  let zNode = document.createElement("div");
  zNode.innerHTML = `
    <button id="down-this" class="btn" type="button"> ${
      APP_LANGUAGES[appLang].gen_this_link
    } </button>

    <select id="changeLanguage" class="subtitleSelect" name="lang">
      ${createSubLanguageOptions()}
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

    <div id="plugin_notice"></div>

    <div id="snackbar"></div>
  `;

  zNode.setAttribute("id", "downloadBiliintScript");
  document.body.appendChild(zNode);

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

  const processSubtitleArrayFromServer = async ({ ep_title, ep_sub_url }) => {
    const _isAssSubtitleFile = (str) => str.includes("[V4+ Styles]");

    const r = await fetch(ep_sub_url);
    const rText = await r.text();

    let dataFormatName = "unknown format";
    let file_format = sub_format;
    if (!isJsonString(rText)) {
      if (_isAssSubtitleFile(rText)) {
        dataFormatName = "ass";

        const blob = new Blob([rText], { type: "text/plain" });

        createDownloadLink({ file_name: ep_title, blob, file_format });
      } else {
        alert("Format subtitles .ass problematic, please contact DEV");
      }
    } else {
      dataFormatName = "json";

      const d = JSON.parse(rText);
      let blob;
      let text = "";

      // Generate SRT and Web VTT format
      if (
        sub_format === "vtt" ||
        sub_format === "srt" ||
        sub_format === "ass"
      ) {
        // Convert second to time stamp
        const _secToTimer = (sec) => {
          let o = new Date(0);
          let p = new Date(sec * 1000);
          return new Date(p.getTime() - o.getTime())
            .toISOString()
            .split("T")[1]
            .split("Z")[0];
        };

        if (sub_format === "vtt") {
          text += `WEBVTT\nKind: captions\nLanguage: ${sub_language}\n\n`;
        }

        // Map body
        d.body.forEach((item, index) => {
          // Get start time
          const from = _secToTimer(item.from !== undefined ? item.from : 0);
          // Get end time
          const to = _secToTimer(item.to);
          // Line
          text += index + 1 + "\n";
          // Time
          text += `${from.replace(".", ",")} --> ${to.replace(".", ",")}\n`;
          // Content
          text += item.content + "\n\n";
        });

        blob = new Blob([text], {
          type: `text/${sub_format === "vtt" ? "vtt" : "plain"}`
        });
      } else {
        // Generate JSON format
        blob = new Blob([JSON.stringify(d)], {
          type: "application/json"
        });
      }

      if (sub_format === "ass") {
        file_format = "srt";

        setNotice(
          ".ass format subtitles are not available, the plugin will automatically create subtitle links in .srt format!"
        );
      }

      // Create <a> tag
      createDownloadLink({ file_name: ep_title, blob, file_format });
    }

    // if mismatch the setting and the download file => show toast
    showToast(
      `The server is returning ${dataFormatName} file. The generated link is .${file_format} file`
    );
  };

  // Create download link for subtitles
  function createDownloadLink({ file_name, blob, file_format = sub_format }) {
    const a = document.createElement("a");
    a.download = `${file_name}.${sub_language}.${file_format}`;
    a.textContent = `${file_name}`;
    a.href = URL.createObjectURL(blob);

    document.getElementById("jsonSubtitleList").appendChild(a);
  }

  async function generateSubtitle({ ep_id, video_id, ep_title }) {
    const isAnime = ep_id > 0;
    const idParam = isAnime ? `episode_id=${ep_id}` : `aid=${video_id}`;

    // Anime: &spm_id=bstar-web.pgc-video-detail.0.0&from_spm_id=bstar-web.homepage.top-list.all
    // Video: &spm_id=bstar-web.ugc-video-detail.0.0&from_spm_id=
    const FETCH_URL = `https://api.bilibili.tv/intl/gateway/web/v2/subtitle?s_locale=vi_VN&platform=web&${idParam}`;

    const r = await fetch(FETCH_URL, { credentials: "include" });
    const rText = await r.text();

    if (!isJsonString(rText)) {
      alert("Can't get subtitles data, please contact DEV");
    } else {
      const { data } = JSON.parse(rText);

      if (data.subtitles === null || data.video_subtitle === null) {
        alert("There is no suitable subtitle data");
      }

      // Take data in response
      const subtitleData = data.subtitles || data.video_subtitle || [];

      // Select the subtitle that corresponds to the selected language
      let matchedSubtitle;
      for (let i = 0; i < subtitleData.length; i++) {
        if (subtitleData[i]["lang_key"] === sub_language) {
          if (!matchedSubtitle) {
            const defaultUrl = data.subtitles[i].url;

            const fallbackUrl =
              data.video_subtitle[i]["srt"]?.url || defaultUrl;

            matchedSubtitle = ["srt", "ass"].includes(sub_format)
              ? data.video_subtitle[i][sub_format]?.url ||
                defaultUrl ||
                fallbackUrl
              : fallbackUrl;
          }
        }
      }

      if (matchedSubtitle) {
        processSubtitleArrayFromServer({
          ep_title,
          ep_sub_url: matchedSubtitle
        });
      } else {
        setNotice("The language you selected, does not have subtitle files!");
      }
    }
  }

  function generateQualities({ ep_id, season_id, video_id }) {
    const isVideo = video_id > 0;
    const isAnime = ep_id > 0;
    const isAnimeSeries = season_id > 0;

    const idParam =
      isAnime || isAnimeSeries
        ? isAnime
          ? `ep_id=${ep_id}`
          : `season_id=${season_id}`
        : `aid=${video_id}`;

    fetch(
      `https://api.bilibili.tv/intl/gateway/web/playurl?${idParam}&platform=web&device=wap&qn=64&tf=0&type=0`,
      { credentials: "include" }
    )
      .then((r) => r.json())
      .then(({ data }) => {
        if (isAnime || isVideo) {
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
        } else {
          // anime series
          if (data?.sections?.length > 0) {
            const eps = data?.sections[0].episodes;
            if (eps.length > 0) {
              const epId = eps[0].episode_id;
              generateQualities(epId);
            }
          }
        }
      });
  }

  // Generate video & audio url of ep
  function generateEpElement({ ep_id, video_id, ep_title }) {
    const isAnime = ep_id > 0;
    const idParam = isAnime ? `ep_id=${ep_id}` : `aid=${video_id}`;

    fetch(
      `https://api.bilibili.tv/intl/gateway/web/playurl?${idParam}&device=wap&platform=web&qn=64&tf=0&type=0`,
      { credentials: "include" }
    )
      .then((r) => r.json())
      .then(({ data }) => {
        var maxVideoQuality = 0;
        var maxAudioQuality = 0;

        const d = data.playurl;

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
            createVideoElement({ ep_url: videoUrl, ep_title });
          } else {
            runLoop = true;
          }
        } else {
          runLoop = true;
        }

        // VIDEO LOOP
        if (runLoop) {
          for (let i = 0; i < d.video.length; i++) {
            const video_url = d.video[i]["video_resource"].url;

            if (video_url !== "") {
              if (maxVideoQuality < d.video[i]["video_resource"].quality) {
                maxVideoQuality = d.video[i]["video_resource"].quality;

                createVideoElement({ ep_url: video_url, ep_title });
              }
            }
          }
        }

        // AUDIO LOOP
        for (let i = 0; i < d["audio_resource"].length; i++) {
          const audio_url = d["audio_resource"][i].url;

          if (audio_url !== "") {
            if (maxAudioQuality < d["audio_resource"][i].quality) {
              maxAudioQuality = d["audio_resource"][i].quality;

              const a = document.createElement("a");
              a.textContent = `${ep_title} `;
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
    const epTitle = getEpTitle();
    const { ep_id, video_id } = getIds();

    if (ep_id > 0 || video_id > 0) {
      generateSubtitle({
        ep_id,
        video_id,
        ep_title: `${epTitle} [${ep_id || video_id}]`
      });

      generateEpElement({
        ep_id,
        video_id,
        ep_title: `${epTitle} [${ep_id || video_id}]`
      });
    } else {
      // Something wrong with `getIds()`
    }
  }

  // Gets: ep_id | video_id | season_id
  function getIds() {
    const pathnameArr = location.pathname.split("/");

    // Test anime episode: https://www.bilibili.tv/en/play/34580/340313
    // Test anime series: https://www.bilibili.tv/en/play/34580
    // Test anime movie: https://www.bilibili.tv/en/play/1005426
    const isAnime = location.pathname.includes("play");

    // Test video: https://www.bilibili.tv/en/video/4786384793243136
    const isVideo = location.pathname.includes("video");

    let epId, videoId, seasonId;
    if (isAnime) {
      if (pathnameArr.length === 5) {
        epId = pathnameArr[pathnameArr.length - 1];
        seasonId = pathnameArr[pathnameArr.length - 2];
      } else {
        seasonId = pathnameArr[pathnameArr.length - 1];
      }

      epId = Number.parseInt(epId);
      seasonId = Number.parseInt(seasonId);
    } else if (isVideo) {
      videoId = pathnameArr[pathnameArr.length - 1];
      videoId = Number.parseInt(videoId);
    } else {
      // Can't identify any ID
    }

    if (epId > 0 || videoId > 0) {
      // ok
    } else {
      // Fallback for anime
      if (isAnime) {
        const activeEp = document.body.querySelector(
          ".video-play .ep-section .ep-list .ep-item--active"
        );
        const epUrlArr = activeEp?.href?.split("?")?.shift()?.split("/") || [];

        // fallback epId
        if (epUrlArr.length === 7) {
          epId = epUrlArr[epUrlArr.length - 1];
          epId = Number.parseInt(epId);
        }

        if (epId > 0) {
          // ok
        } else {
          alert("Can't identify episode ID, please contact dev");
        }
      } else {
        alert("Can't identify video ID, please contact dev");
      }
    }

    return { ep_id: epId, video_id: videoId, season_id: seasonId };
  }

  // Re-generate new links
  function downloadThisEp() {
    // Delete old links (subtitle, video, audio)
    document.getElementById(
      "jsonSubtitleList"
    ).innerHTML = `${APP_LANGUAGES[appLang].subtitle}\&nbsp;:\&nbsp;`;
    document.getElementById(
      "videoList"
    ).innerHTML = `${APP_LANGUAGES[appLang].video}\&nbsp;:\&nbsp;`;
    document.getElementById(
      "audioList"
    ).innerHTML = `${APP_LANGUAGES[appLang].audio}\&nbsp;:\&nbsp;`;

    // Reset notice message
    setNotice("");

    // Generate new links
    generateCurrentEpisodeElement();
  }

  // Change subtitle language
  function changeLanguage(e) {
    localStorage.setItem("SUB_LANGUAGE", e.target.value);
    sub_language = e.target.value;

    // Re-generate new links
    downloadThisEp();
  }

  // Change subtitle file format
  function changeSubFormat(e) {
    localStorage.setItem("SUB_FORMAT", e.target.value);
    sub_format = e.target.value;

    // Re-generate new links
    downloadThisEp();
  }

  // Video quality change
  function changeQuality(e) {
    const values = e.target.value.split(";");

    localStorage.setItem("VIDEO_QUALITY", values[0]);
    selectedQuality = e.target.value;

    localStorage.setItem("VIDEO_CODEC", values[1]);
    selectedCodec = e.target.value;

    // Re-generate new links
    downloadThisEp();
  }

  // Get the title of the episode
  function getEpTitle() {
    const seriesTitle = getSeriesTitle();

    const titleName = document.title
      ?.replace(" - BiliBili", "")
      ?.replace(`${seriesTitle} `, "");

    const breadcrumbName = document.body.querySelector(
      ".video-play__breadcrumb .breadcrumb__item:last-child > .breadcrumb__item-text"
    )?.innerText;

    const epTitle = breadcrumbName || titleName;

    const epTitlePrefix = epTitle.split(" - ")[0];
    const epName = epTitle.split(" - ")[1];

    let epNumber = epTitlePrefix?.replace(/[^0-9]/g, "");
    if (typeof epNumber === "string") {
      epNumber = Number.parseInt(epNumber);
    }

    let customEpTitle;
    if (epNumber >= 0) {
      customEpTitle = `E${`${epNumber}`}${epName ? ` - ${epName}` : ""}`;
    } else {
      // PV ep
      customEpTitle = `${epTitlePrefix || seriesTitle} - ${epName || epTitle}`;
    }

    return customEpTitle;
  }

  // Get the title of the series
  function getSeriesTitle() {
    const ogTitle = document.head
      .querySelector("[property='og:title'][content]")
      ?.content?.replace(" HD | bilibili", "");

    const metaTitle = document.body.querySelector(
      ".video-play .video-play__meta .bstar-meta .bstar-meta__title"
    )?.innerText;

    const metaOrginName = document.body.querySelector(
      ".video-play .video-play__meta .bstar-meta .bstar-meta__extra .bstar-meta__origin-name .bstar-meta__origin-name-content"
    )?.innerText;

    const metaAliasName = document.body.querySelector(
      ".video-play .video-play__meta .bstar-meta .bstar-meta__extra .bstar-meta__alias .bstar-meta__alias-content"
    )?.innerText;

    return ogTitle || metaTitle || metaAliasName || metaOrginName;
  }

  // Show Toast Message & automatically turn off after 3s
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

  function setNotice(message) {
    const noticeEle = document.getElementById("plugin_notice");

    noticeEle.innerText = message;
  }

  // Style newly added button
  GM_addStyle(`

    #downloadBiliintScript {
      position: fixed;
      bottom: 2.2vw;
      left: 2.2vw;
      z-index: 9999;
      opacity: 0.97;
      background: black;
      padding: 16px;
    }

    #down-this {
      background: #4c93ff;
      margin-bottom: 16px;

      color: white;
      font-weight: 700;
    }

    .linkContainer {
      margin-top: 16px;

      color: black;
      background: white;
      opacity: 0.97;
      border-radius: 20px;
      padding: 8px;
      font-size: 15px
    }

    .btn {
      cursor: pointer;
      padding: 3px;
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
      margin-right: 8px;

      border-radius: 20px;
      padding: 8px;
      background: white;
      opacity: 0.97;
    }

    #plugin_notice {
      margin-top: 16px;

      color: red;
      font-size: 13px;
      font-style: italic;
    }
    #plugin_notice:empty {
      display: none;
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
