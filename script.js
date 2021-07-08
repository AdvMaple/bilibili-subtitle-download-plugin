var zNode = document.createElement("div");
zNode.innerHTML = '<button id="myButton" type="button"> Click me </button>';
zNode.setAttribute("id", "myContainer");
document.body.appendChild(zNode);

document
  .getElementById("myButton")
  .addEventListener("click", ButtonClickAction, false);

function ButtonClickAction(zEvent) {
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
      epList = x.data.episodes;
      epList.map((x) => {
        const { title, ep_id } = x;
        console.log(title, ep_id);

        fetch(`https://api.biliintl.com/intl/gateway/m/subtitle?ep_id=${ep_id}`)
          .then((r) => r.json())
          .then((d) => {
            const { data } = d;
            len = data.subtitles.length;
            for (let i = 0; i < len; i++) {
              if (data.subtitles[i].key == "vi") {
                // console.log(data.subtitles[i].url);
                ep_sub_url = data.subtitles[i].url;

                var a = document.createElement("a");
                a.textContent = title + " ";
                a.href = ep_sub_url;
                document.getElementById("myContainer").appendChild(a);
              }
            }
            // console.log(data.subtitles);

            // var a = document.createElement("a");
            // a.textContent = title + " ";
            // a.href = "http://google.com";
            // document.getElementById("myContainer").appendChild(a);
          });
      });
    });

  //   var zNode = document.createElement("a");
  //   a.textContent = title;
  //   zNode.innerHTML = "The button was clicked";
  //   document.getElementById("myContainer").appendChild(zNode);
}

console.log("Hello");

// var url = window.location.href;
// var id = url.match(/\d+/g);
// var series_id = id[0];
// var ep_id = id[1];

// console.log(url);
// console.log("series_id", series_id);
// console.log("ep_id", ep_id);

// var x;
// fetch(
//   `https://api.biliintl.com/intl/gateway/web/view/ogv_collection?s_locale=vi&season_id=${series_id}`
// )
//   .then((r) => r.json())
//   .then((data) => (x = data))
//   .then(() => {
//     epList = x.data.episodes;
//     epList.map((x) => {
//       const { title, ep_id } = x;
//       console.log(title, ep_id);

//       fetch(`https://api.biliintl.com/intl/gateway/m/subtitle?ep_id=${ep_id}`)
//         .then((r) => r.json())
//         .then((d) => {
//           const { data } = d;
//           console.log(data.subtitles);
//         });
//     });
//   });

// Style newly added button
GM_addStyle(`
  #myContainer {
      position:               fixed; 
      bottom:                 6rem;
  }
  #myButton {
      cursor:                 pointer;
  }
  #myContainer a {
      color:                  red;
      background:             white;
  }
`);
