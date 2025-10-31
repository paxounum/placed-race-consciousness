// This isn't necessary but it keeps the editor from thinking L and carto are typos
/* global L, carto, Mustache */

//COLOR VOCAB
/* 
  --owhite: #f0f4f4;
  --gold: #bb8b41;
  --green: #a2a95a;
  --dgreen: #688773;
  --blue: #4a82ad;
  --red: #c27c69;
  --purple: #8071b2;
  --gray: #535e5e;
  --oil: #886347;
  --land: #bab56d;
  --rust: #ba916d;
  --river: #6d9eba;
  --mountain: #b0a7c9;
*/

var map = L.map("map", {
  center: [39.198205,-89.165039],
  zoom: 4
});

var minimal = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}.png');
var labels = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png');

// Add the default to the map to start
minimal.addTo(map);

var basemaps = {
  'Minimal': minimal,
  'Labeled': labels
};

// Make layer switcher control (shows up in the top right of the map by default
// L.control.layers(basemaps).addTo(map);


// Initialize Carto
var client = new carto.Client({
  apiKey: "default_public",
  username: "browj934"
});

//Story Point Data
var storySource = new carto.source.SQL("SELECT * FROM race_consciousness_responses_combined");

//Story Style
var storyStyle = new carto.style.CartoCSS(`
#layer {
  marker-width:  ramp([point], (30, 30, 25, 40), ("Pivot", "Focal", "Home", "Return"), "=");
  marker-file: ramp([point], (url('https://cdn.glitch.com/92e677e8-5cc8-429f-8f4b-cbf85b4aabfa%2FAsset%202.svg'), url('https://cdn.glitch.com/92e677e8-5cc8-429f-8f4b-cbf85b4aabfa%2Feyelines_1.svg'), url('https://cdn.glitch.com/92e677e8-5cc8-429f-8f4b-cbf85b4aabfa%2Fhouse-root-1.svg'), url('https://cdn.glitch.com/92e677e8-5cc8-429f-8f4b-cbf85b4aabfa%2FAsset%203.svg')), ("Pivot", "Focal", "Home", "Return"), "=");
  marker-allow-overlap: true;
  marker-fill: #000000;
  marker-fill-opacity: 1;
  marker-line-color: #FFFFFF;
}
`);

// Add style to the Story data
var storyLayer = new carto.layer.Layer(storySource, storyStyle, { 
                featureClickColumns: ['place', 'response', 'participant']}
                                      );

//Connection Line Data
var lineSource = new carto.source.SQL("SELECT * FROM connections_rev");

//Connection Style
var lineStyle = new carto.style.CartoCSS(`
#layer {
  line-width: 1.5;
  line-color: ramp([participant], (#E58606, #5D69B1, #52BCA3, #99C945, #CC61B0, #24796C, #DAA51B, #2F8AC4, #764E9F, #A5AA99), ("Allison", "b", "Jason", "Kara", "Karrie", "Kyle", "Rebekah", "Scott", "Tim"), "=");
}
#layer::labels {
  text-name: [participant];
  text-face-name: 'Lato Regular';
  text-size: 12;
  text-fill: #2b2b2b;
  text-label-position-tolerance: 0;
  text-halo-radius: 2;
  text-halo-fill: #ffffff;
  text-dy: -10;
  text-allow-overlap: true;
  text-placement: point;
  text-placement-type: dummy;
  text-min-path-length: 0;
}
`);

// Add style to the Connection data
var lineLayer = new carto.layer.Layer(lineSource, lineStyle);

// Add style to the Story data
var storyLayer = new carto.layer.Layer(storySource, storyStyle, { 
                featureClickColumns: ['place', 'response', 'participant', 'point', 'place_sub']}
                                      );

//Region Data
var regionSource = new carto.source.SQL("SELECT * FROM all_regions");

//Region Style
var regionStyle = new carto.style.CartoCSS(`
#layer {
  polygon-fill: ramp([layer], (#886347, #b0a7c9, #ba916d, #6d9eba, #bab56d, #B3B3B3), ( "oil", "appalachia", "rust", "water", "native_land"), "=");
  polygon-opacity: 0.30;
}
#layer::outline {
  line-width:  ramp([layer], (0, 2, 0, 0, 0, 0), ("native_land", "oil", "appalachia", "rust", "water"), "=");
  line-color: #886347;
  line-opacity: 0.5;
  line-dasharray: 2;
}
`);

// Add style to the Region data
var regionLayer = new carto.layer.Layer(regionSource, regionStyle, { 
                featureClickColumns: ['participant']}
                                       );

// Add the data to the map as a layer
client.addLayers([regionLayer, lineLayer, storyLayer]);
client.getLeafletLayer().addTo(map);

//Story PICKER

// Step 1: Find the dropdown by class. If you are using a different class, change this.
var storyPicker = document.querySelector('.story-picker');

// Step 2: Add an event listener to the dropdown. We will run some code whenever the dropdown changes.
storyPicker.addEventListener('change', function (e) {
  // The value of the dropdown is in e.target.value when it changes
  var story = e.target.value;
  
  // Step 3: Decide on the SQL query to use and set it on the datasource
  if (story === 'all') {
    // If the value is "all" then we show all of the features, unfiltered
    storySource.setQuery("SELECT * FROM race_consciousness_responses_combined");
    lineSource.setQuery("SELECT * FROM connections_rev");
    regionSource.setQuery("SELECT * FROM all_regions");
  }
  else {
    storySource.setQuery("SELECT * FROM race_consciousness_responses_combined WHERE participant = " + "'" + e.target.value + "'");
    lineSource.setQuery("SELECT * FROM connections_rev WHERE participant = " + "'" + e.target.value + "'");
    regionSource.setQuery("SELECT * FROM all_regions WHERE participant = " + "'" + e.target.value + "'");
  }
});

//Adding Popup
var popupTemplate = document.querySelector('.popup-template').innerHTML;

storyLayer.on('featureClicked', function (event) {
  
  var content =  Mustache.render(popupTemplate, event.data);
  // If you're not sure what data is available, log it out:
  console.log(event.data);
  
  var popup = L.popup();
  popup.setContent(content);
  
  // Place the popup and open it
  popup.setLatLng(event.latLng);
  popup.openOn(map);
  map.setView(event.latLng);
});

// Make the Carto layer(s) always show up on top by setting the z-index
client.getLeafletLayer().setZIndex(500).addTo(map);

/*ABOUT -- Thanks Victoria! */

var about = document.getElementById("about");
var aboutMe = document.getElementById("about-me");

// Get the button that opens the modal
var btn = document.getElementById("page-block");
var btnMe = document.getElementById("page-block-me");

// Get the <span> element that closes the modal
var spanMe = document.getElementsByClassName("close-me")[0];
var span = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
btn.onclick = function() {
  about.style.display = "block";
};

// When the user clicks on the button, open the modal
btnMe.onclick = function() {
  aboutMe.style.display = "block";
};

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  about.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == about) {
    about.style.display = "none";
  }
};

// When the user clicks on <span> (x), close the modal
spanMe.onclick = function() {
  aboutMe.style.display = "none";
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == aboutMe) {
    aboutMe.style.display = "none";
  }
};