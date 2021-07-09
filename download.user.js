// ==UserScript==
// @name         biliintl download
// @version      0.2.2
// @description  download json subtitle from biliintl
// @author       AdvMaple
// @match        *://www.biliintl.com/*
// @icon         https://www.google.com/s2/favicons?domain=biliintl.com
// @updateURL    https://github.com/AdvMaple/biliintl_subtitle_download_plugin/raw/main/download.user.js
// @grant        GM_addStyle
// @require      http://code.jquery.com/jquery-3.6.0.min.js

// ==/UserScript==
(function () {
  var zNode = document.createElement("div");
  zNode.innerHTML = '<button id="myButton" type="button"> Click me </button>';
  zNode.setAttribute("id", "myContainer");
  document.body.appendChild(zNode);

  document
    .getElementById("myButton")
    .addEventListener("click", ButtonClickAction, false);

  function ButtonClickAction(zEvent) {
    try {
      var div_content =
        document.getElementsByClassName("video-info__title")[0].innerText;
    } catch (e) {
      console.log(e);
    }

    var url = window.location.href;
    var id = url.match(/\d+/g);
    var series_id = id[0];
    var ep_id = id[1];

    console.log(url);
    console.log("series_id", series_id);
    console.log("ep_id", ep_id);

    var x;
    fetch(
      `https://api.biliintl.com/intl/gateway/web/view/ogv_collection?s_locale=vi&season_id=${series_id}`
    )
      .then((r) => r.json())
      .then((data) => (x = data))
      .then(() => {
        var epList = x.data.episodes;

        epList.map((x) => {
          const { title, ep_id } = x;
          console.log(title, ep_id);

          fetch(
            `https://api.biliintl.com/intl/gateway/m/subtitle?ep_id=${ep_id}`
          )
            .then((r) => r.json())
            .then((d) => {
              const { data } = d;
              // console.log(data);
              var len = data.subtitles.length;
              for (let i = 0; i < len; i++) {
                if (data.subtitles[i].key == "vi") {
                  var ep_sub_url = data.subtitles[i].url;
                  fetch(ep_sub_url)
                    .then((r) => r.json())
                    .then((d) => {
                      var blob = new Blob([JSON.stringify(d)], {
                        type: "application/json",
                      });
                      var url_from_blob = URL.createObjectURL(blob);

                      var a = document.createElement("a");
                      a.download = `${div_content} ep ${title}.json`;
                      a.textContent = " " + title;
                      a.href = url_from_blob;
                      document.getElementById("myContainer").appendChild(a);
                    });
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

        document.getElementById("myContainer").appendChild(zNode);

        document
          .getElementById("mySortBtn")
          .addEventListener("click", ButtonSortClick, false);

        function ButtonSortClick(zEvent) {
          var sort_by_num = function (a, b) {
            return a.innerText - b.innerText;
          };

          var list = $("#myContainer > a").get();
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
  #myContainer {
      position:               fixed; 
      bottom:                 6rem;
      left: 1rem;
      margin: 3px;
  }
  #myButton {
    cursor:                 pointer;
    padding: 3px;
    margin-bottom: 3px;
  }

  #myButton:hover {
    cursor:                 pointer;
    padding: 3px;
    margin-bottom: 3px;
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
    cursor:                 pointer;
    padding: 3px;
    background-color: #4078cb;
    color: white;
  }

  #myContainer a {
      color:                  red;
      background:             white;
  }
  #myContainer a:hover {
    color:                  #4078cb;
    background:             white;
}
`);
})();
