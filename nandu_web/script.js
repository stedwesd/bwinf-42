var board;
var markers = [];
var sources = [];
var sensors = [];
var lights = [];
var snapX, snapY;
var lightMap = []; // 0: nothing, 1: obstacle, 2: horizontal light, 3: vertical light, 4: crossing lights
var tableTarget = $("#table").get(0);
var tableOuts = [];
var showLights = false;

var customMarkerTarget;
var customMarkerParts = [];
var customMarkerColor = "#ffffff";
var customMarkerNumberOfInputs = 0;
var customMarkerNumberOfOutputs = 0;
var customMarkerIndex = -1;

var input = {
    snapX: $("#snap-x"),
    snapY: $("#snap-y"),
    size: $("#board-size")
};

// INIT :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
function init(/*event*/) {
    // prevent when called by submit
    //event && event.preventDefault();

    // cast input values to numbers
    snapX = +input.snapX.val();
    snapY = +input.snapY.val();
    board.size = +input.size.val();
    board.rows = Math.floor(100 / snapY);
    board.cols = Math.floor(100 / snapX);
    console.log(board.cols);

    createGrid();
    updateSize();

    console.log("init");
}

function initMarker(marker) {
    // Set marker's size here
    marker.target.css({
        width: marker.width + "%",
        height: marker.height + "%",
        background: marker.color
    });

    // Make the marker element draggable
    marker.target.draggable({
        containment: "parent", // Keep the marker within its parent element (the board)
        snap: ".cell",         // Snap to elements with the class "cell"
        snapMode: "both"       // Snap to both the x and y axes
        /*
        drag: function (event, ui) {
            onDrag(event, ui, marker); // Pass the marker to onDrag
        }*/
    });

    //Summon In- and Outputs
    var s=marker.inOut;
    marker.inOutTargets=[[],[],[],[]]
    for(var c=0; c<4; c++) {
        for(var i=0; i<s[c].length; i++) {
            if(s[c][i]!=null) {
                var target;
                if(s[c][i][0]=="I") {
                    target = $("<div class='in' />").appendTo(marker.target);
                }
                if(s[c][i][0]=="O") {
                    target = $("<div class='out' />").appendTo(marker.target);
                }
                if(c<=1) {
                    target.css({
                        left: (80*c)/*-10/marker.realWidth*/ + "%",
                        top: 100/marker.realHeight*i+25/marker.realHeight + "%",
                        width: 20/marker.realWidth + "%",
                        height: 50/marker.realHeight + "%"
                    });
                }
                else {
                    target.css({
                        left: 100/marker.realWidth*i+25/marker.realWidth + "%",
                        top: (80*(c-2))/*-10/marker.realHeight*/ + "%",
                        width: 50/marker.realWidth + "%",
                        height: 20/marker.realHeight + "%"
                    });
                }
                marker.inOutTargets[c].push(target);
                continue;
            }
            marker.inOutTargets[c].push(null);
        }
    }

    console.log("initMarker called");
    return (marker);
}

function initSource(source) {
    // Set source's size here
    source.target.css({
        width: source.width + "%",
        height: source.height + "%",
    });

    // Make the marker element draggable
    source.target.draggable({
        containment: "parent", // Keep the marker within its parent element (the board)
        snap: ".cell",         // Snap to elements with the class "cell"
        snapMode: "both"       // Snap to both the x and y axes
        /*
        drag: function (event, ui) {
            onDrag(event, ui, marker); // Pass the marker to onDrag
        }*/
    });

    //Summon In- and Outputs
    var s=source.outs;
    for(var c=0; c<4; c++) {
        if(s[c]) {
            target = $("<div class='source-out' />").appendTo(source.target);
            if(c<=1) {
                target.css({
                    left: (80*c)/*-10*/ + "%",
                    top: 25 + "%",
                    width: 20 + "%",
                    height: 50 + "%"
                });
            }
            else {
                target.css({
                    left: 25 + "%",
                    top: (80*(c-2))/*-10*/ + "%",
                    width: 50 + "%",
                    height: 20 + "%"
                });
            }
            continue;
        }
    }
    
    console.log("initSource called");
    return (source);
}

function onDrag(marker) { // is used for both markers and sources
    // Snap the marker to the nearest grid cell within the board
    var xGrid = Math.round(parseFloat(marker.target.css('left')) / board.width * board.cols) * (100 / board.cols);
    var yGrid = Math.round(parseFloat(marker.target.css('top')) / board.height * board.rows) * (100 / board.rows);

    // Set the marker's position to the snapped values in percentages
    marker.target.css({
        left: xGrid + "%",
        top: yGrid + "%"
    });

    // Update the marker's xPercent and yPercent
    if(marker.xPercent != xGrid || marker.yPercent != yGrid) {
        marker.xPercent = xGrid;
        marker.yPercent = yGrid;
        updateLightMap();
    }
}

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (!arr1[i].every((val, index) => val === arr2[i][index])) {
            return false;
        }
    }
    return true;
}

//LightMap:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
function updateLightMap() {
    lightMap = resetLightMap();
    deleteLights();
    updateLightMapObstacles();
    var oldMap = lightMap;
    updateLightSources();
    extendLights();
    do {
        oldMap = JSON.parse(JSON.stringify(lightMap)); // Deep copy of lightMap
        updateLightMarkers();
    } while (!arraysEqual(oldMap, lightMap));

    updateLightSensors();
    updateTable();
}

function resetLightMap() {
    var myLightMap = [];
    for(var y=0; y<board.rows; y++) {
        var subList = [];
        for(var x=0; x<board.cols; x++) {
            subList.push(0);
        }
        myLightMap.push(subList);
    }
    return(myLightMap);
}

function deleteLights() {
    $(".horizontal-light").remove();
    $(".vertical-light").remove();
    lights=[];
}

function updateLightMapObstacles(){
    markers.forEach(function (marker) {
        var pos={
            x: Math.floor(marker.xPercent/100*board.cols),
            y: Math.floor(marker.yPercent/100*board.rows)
        };

        var size={
            x: marker.realWidth,
            y: marker.realHeight
        };
        for(var x=pos.x; x<pos.x+size.x; x++) {
            for(var y=pos.y; y<pos.y+size.y; y++) {
                lightMap[y][x]=1;
            }
        }
    });
    
    sources.forEach(function (source) {
        lightMap[Math.floor(source.yPercent/100*board.rows)][Math.floor(source.xPercent/100*board.cols)] = 1;
    });
}

function updateLightSources(){
    sources.forEach(function (source) {
        if(!source.active){
            return;
        }
        for(var i=0;i<4;i++) {
            if(source.outs[i]==true) {
                var pos = [];
                if(i<=1) {
                    pos = [Math.floor(source.xPercent/100*board.cols+2*i-1),Math.floor(source.yPercent/100*board.rows)];
                    newLight(0,pos);
                }
                else {
                    pos = [Math.floor(source.xPercent/100*board.cols),Math.floor(source.yPercent/100*board.rows+2*(i-2)-1)];
                    newLight(1,pos);
                }
            }
        }
    });
}

function extendLights() {
    do {
        var oldMap = JSON.parse(JSON.stringify(lightMap));
        lights.forEach(function (light) {
            if(light.type==0) {
                newLight(light.type,[light.x-1,light.y]);
                newLight(light.type,[light.x+1,light.y]);
            }
            if(light.type==1) {
                newLight(light.type,[light.x,light.y-1]);
                newLight(light.type,[light.x,light.y+1]);
            }
        });
    } while (!arraysEqual(oldMap,lightMap));
}

function updateLightMarkers() {
    l = []
    for(var i=0;i<markers.length;i++) {
        l.push({x:markers[i].xPercent,index:i})
    }
    for(var i=0;i<markers.length;i++) {
        for(var j=0;j<markers.length-i-1;j++) {
            if(l[j].x > l[j+1].x) {
                var temp = l[j];
                l[j]=l[j+1];
                l[j+1]=temp;
            }
        }
    }
    
    l.forEach(function (element) {
        var marker = markers[element.index];
        var pos={
            x: Math.floor(marker.xPercent/100*board.cols),
            y: Math.floor(marker.yPercent/100*board.rows)
        };
        var size={
            x: marker.realWidth,
            y: marker.realHeight
        };

        // Get positions of space at input and output
        var inOut = marker.inOut;
        var ins = [];
        var outs = [];
        for(var c=0; c<4; c++) {
            for(var i=0; i<inOut[c].length; i++) {
                if(inOut[c][i] != null) {
                    var number;
                    var match = inOut[c][i].match(/\d+$/); // Regular expression to match one or more digits at the end of the string
                    if (match) {
                        number=parseInt(match[0]); // Convert the matched string to an integer
                    }
                    else{
                        console.log("Krise");
                    }
                    
                    var element = [(c-(c%2))/2];
                    
                    if(c==0) {
                        element[1]=pos.x-1;
                        element[2]=pos.y+i;
                    }
                    else if(c==1){
                        element[1]=pos.x+size.x;
                        element[2]=pos.y+i;
                    }
                    if(c==2) {
                        element[1]=pos.x+i;
                        element[2]=pos.y-1;
                    }
                    else if(c==3) {
                        element[1]=pos.x+i;
                        element[2]=pos.y+size.y;
                    }
                    
                    if(inOut[c][i][0]=="I") {
                        ins[number-1]=element;
                    }
                    else{
                        outs[number-1]=element;
                    }
                }
            }
        }

        // Check which ins are active
        var activeIns = []; // True: 0, False: 1
        for(var i=0; i<ins.length; i++) {
            if(ins[i][1]<0 || ins[i][1]>board.cols || ins[i][2]<0 || ins[i][2]>board.rows) {
                activeIns[i]=1;
                continue;
            }
            if(lightMap[ins[i][2]][ins[i][1]]==4 || lightMap[ins[i][2]][ins[i][1]]==ins[i][0]+2) {
                activeIns[i]=0;
                continue;
            }
            activeIns[i]=1;
        }

        // Use rules to get the active outputs
        var index = 0;
        for(var i=0; i<ins.length; i++) {
            index+=activeIns[i]*(Math.pow(2, ins.length-i-1));
        }
        activeOuts = marker.rules[index];

        // Summon new light at active outputs
        for(var i=0; i<activeOuts.length; i++) {
            if(activeOuts[i]){
                newLight(outs[i][0],[outs[i][1],outs[i][2]]);
            }
        }

        extendLights();
        console.log(lightMap);
    });
}

function updateLightSensors() {
    sensors.forEach(function(sensor) {
        var pos={
            x: Math.floor(sensor.xPercent/100*board.cols),
            y: Math.floor(sensor.yPercent/100*board.rows)
        };
        if(lightMap[pos.y][pos.x] == 2 || lightMap[pos.y][pos.x] == 3 || lightMap[pos.y][pos.x] == 4) {
            sensor.active = true;
            sensor.target.find(".sensor-lamp").css({background: "yellow"});
            console.log("true");
        }
        else {
            sensor.active = false;
            sensor.target.find(".sensor-lamp").css({background: "lightgray"});
            console.log("false");
        }
    })
}

function newLight(type,pos) { //type: 0 horizontal, 1 vertical; pos as array [x,y]
    // Check if the space is inside of the grid
    if(pos[0]<0 || pos[0]>=board.cols || pos[1]<0 || pos[1]>=board.rows) {
        return;
    }
    // Check if there is already a building or another light in the same direction on that space
    if(lightMap[pos[1]][pos[0]]==1 || lightMap[pos[1]][pos[0]]==4 || lightMap[pos[1]][pos[0]]==type+2) {
        return;
    }

    if(showLights) {
        var newLight;
        if(type==0) {
            newLight = $("<div class='horizontal-light' />").appendTo(board.target);
            newLight.css({
                left: pos[0]*100/board.cols + "%",
                top: (pos[1]+0.4)*100/board.rows + "%",
                width: 100/board.cols + "%",
                height: 20/board.rows + "%"
            })
        }
        if(type==1) {
            newLight = $("<div class='vertical-light' />").appendTo(board.target);
            newLight.css({
                left: (pos[0]+0.4)*100/board.cols + "%",
                top: pos[1]*100/board.rows + "%",
                width: 20/board.cols + "%",
                height: 100/board.rows + "%"
            })
        }
    }
    var light = {
        x: pos[0],
        y: pos[1],
        type: type
    }
    
    if(lightMap[pos[1]][pos[0]]==0) {
        lightMap[pos[1]][pos[0]]=type+2;
    }
    else{
        lightMap[pos[1]][pos[0]]=4;
    }
    lights.push(light);
}

// SIZING :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
function updateSize() {
    var winWidth = window.innerWidth;
    var winHeight = window.innerHeight;
    var landscape = (winWidth > winHeight);

    var min = Math.min(winWidth, winHeight);
    var max = Math.max(winWidth, winHeight);
    var size = board.size * min / 100;

    TweenLite.set(board.target, {
        xPercent: -50,
        yPercent: -50,
        width: size / (landscape ? max : min) * 100 + "%",
        paddingTop: size / (landscape ? max : min) * 100 + "%"
    });
}

// GRID :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
function createGrid() {
    // remove previous cells
    $(".cell").remove();

    for (var row = 0; row < board.rows; row++) {
        for (var col = 0; col < board.cols; col++) {
            // skip every other one to create a checkerboard pattern
            if (((row % 2) && !(col % 2)) || (!(row % 2) && (col % 2))) continue;

            var target = $("<div class='cell' />").appendTo(board.target);

            TweenLite.set(target, {
                width: 100 / board.cols + "%",
                height: 100 / board.rows + "%",
                left: col * 100 / board.cols + "%",
                top: row * 100 / board.rows + "%"
            });
        }
    }
}

$(document).ready(function () {

    $("#apply-button").on("click", function (event) {
        event.preventDefault();
        init(event);
    });

    board = {
        _bounds: null,
        size: null,
        target: $("#board"),

        get bounds() { return this._bounds || this.target[0].getBoundingClientRect(); },
        set bounds(bounds) { this._bounds = bounds; },

        get width() { return this.bounds.width; },
        get height() { return this.bounds.height; }
    }

    init(); // Initialize the board

    lightMap = resetLightMap();

    customMarkerSetUp();
});

// Function to set the marker's relative position
function setRelativeMarker(marker) {
    TweenLite.set(board.target, { zIndex: 10 });
    TweenLite.set(marker.target, {
        left: marker.xPercent + "%",
        top: marker.yPercent + "%"
    });
    if(marker.xPercent>=100 || marker.yPercent>=100) {
        marker.target.remove();
        markers.splice(markers.indexOf(marker), 1);
    }
}

function setRelativeSource(marker) {
    TweenLite.set(board.target, { zIndex: 10 });
    TweenLite.set(marker.target, {
        left: marker.xPercent + "%",
        top: marker.yPercent + "%"
    });
    if(marker.xPercent>=100 || marker.yPercent>=100) {
        marker.target.remove();
        sources.splice(sources.indexOf(marker), 1);
        for(var i=0;i<sources.length;i++) {
            console.log(sources[i].active);
            sources[i].target.contents()[0].nodeValue = i+1;
        }
    }
}

function setRelativeSensor(marker) {
    TweenLite.set(board.target, { zIndex: 10 });
    TweenLite.set(marker.target, {
        left: marker.xPercent + "%",
        top: marker.yPercent + "%"
    });
    if(marker.xPercent>=100 || marker.yPercent>=100) {
        marker.target.remove();
        sensors.splice(sensors.indexOf(marker), 1);
        for(var i=0;i<sensors.length;i++) {
            console.log(sensors[i].active);
            sensors[i].target.contents()[0].nodeValue = i+1;
        }
    }
}

// Functions:::::::::::::::::::::::::::::::::
var markerTypes = [
    {
        color: "white",
        realWidth: 1,
        realHeight: 2,
        inOut: [["I1","I2"],["O1","O2"],[null],[null]],
        rules: [
            [false,false], // Inputs: true, true
            [true,true], // Inputs: true, false
            [true,true], // Inputs: false, true
            [true,true] // Inputs: false, false
        ]
    },
    {
        color: "#FF0000",
        realWidth: 1,
        realHeight: 2,
        inOut: [["I1",null],["O1","O2"],[null],[null]],
        rules: [
            [false,false], // Input: true
            [true,true] // Input: false
        ]
    },
    {
        color: "#FF0000",
        realWidth: 1,
        realHeight: 2,
        inOut: [[null,"I1"],["O1","O2"],[null],[null]],
        rules: [
            [false,false], // Input: true
            [true,true] // Input: false
        ]
    },
    {
        color: "#0000FF",
        realWidth: 1,
        realHeight: 2,
        inOut: [["I1","I2"],["O1","O2"],[null],[null]],
        rules: [
            [true,true], // Inputs: true, true
            [true,false], // Inputs: true, false
            [false,true], // Inputs: false, true
            [false,false] // Inputs: false, false
        ]
    }
]

function createMarker(type, xPercent, yPercent) {
    var newMarker = $("<div class='marker' />").appendTo(board.target);
    var type = markerTypes[type];

    // Initialize the new marker
    var marker = {
        isDragging: false,
        target: newMarker,
        width: snapX*type.realWidth,
        height: snapY*type.realHeight,
        realWidth: type.realWidth,
        realHeight: type.realHeight,
        xPercent: xPercent,
        yPercent: yPercent,
        inOut: type.inOut, // left, right, top, bottom
        inOutTargets: [],
        rules: type.rules,
        color: type.color,
    };

    // Set the initial position of the new marker using xPercent and yPercent
    marker.target.css({
        left: xPercent + "%",
        top: yPercent + "%"
    });

    markers.push(initMarker(marker)); // Push the marker object, not the result of initMarker

    marker.target.on("mousedown", function (event) {
        event.preventDefault();
        marker.isDragging = true;

        var startX = event.clientX;
        var startY = event.clientY;
        var startLeft = parseFloat(marker.target.css('left')) || 0;
        var startTop = parseFloat(marker.target.css('top')) || 0;

        document.onmousemove = function (e) {
            if (marker.isDragging) {
                var newX = startLeft + e.clientX - startX;
                var newY = startTop + e.clientY - startY;
                // Ensure the marker stays within the board
                newX = Math.min(Math.max(newX, 0), board.width - marker.width);
                newY = Math.min(Math.max(newY, 0), board.height - marker.height);

                marker.target.css({ left: newX + 'px', top: newY + 'px'});

                onDrag(marker);
            }
        };

        document.onmouseup = function () {
            marker.isDragging = false;
            document.onmousemove = null;
            document.onmouseup = null;

            board.bounds = null;
            setRelativeMarker(marker);
        };
    });

    updateLightMap();
}

function createSource(outs,xPercent,yPercent) {
    var newSource = $("<div class='source'>"+(sources.length+1)+"</div>").appendTo(board.target);
    
    var source = {
        isDragging: false,
        target: newSource,
        outs: outs,
        width: 100/board.cols,
        height: 100/board.rows,
        xPercent: xPercent,
        yPercent: yPercent,
        active: true
    };

    source.target.css({
        left: xPercent + "%",
        top: yPercent + "%"
    });

    sources.push(initSource(source));

    source.target.on("mousedown", function (event) {
        event.preventDefault();
        source.isDragging = true;

        var startX = event.clientX;
        var startY = event.clientY;
        var startLeft = parseFloat(source.target.css('left')) || 0;
        var startTop = parseFloat(source.target.css('top')) || 0;
        var click = true;

        document.onmousemove = function (e) {
            if (source.isDragging) {
                var newX = startLeft + e.clientX - startX;
                var newY = startTop + e.clientY - startY;
                // Ensure the source stays within the board
                newX = Math.min(Math.max(newX, 0), board.width - source.width);
                newY = Math.min(Math.max(newY, 0), board.height - source.height);

                source.target.css({ left: newX + 'px', top: newY + 'px'});

                onDrag(source);
            }
            click=false;
        };

        document.onmouseup = function () {
            if(click) {
                source.active=!source.active;
            }
            source.isDragging = false;
            document.onmousemove = null;
            document.onmouseup = null;

            board.bounds = null;
            setRelativeSource(source);
            updateLightMap();
        };
    });

    updateLightMap();
}

function createSensor(ins,xPercent,yPercent) {
    var newSensor = $("<div class='sensor'>"+(sensors.length+1)+"</div>").appendTo(board.target);
    $("<div class='sensor-lamp'></div>").appendTo(newSensor);
    
    var sensor = {
        isDragging: false,
        target: newSensor,
        ins: ins,
        width: 100/board.cols,
        height: 100/board.rows,
        xPercent: xPercent,
        yPercent: yPercent,
        active: false
    };

    sensor.target.css({
        left: xPercent + "%",
        top: yPercent + "%"
    });

    // Set source's size here
    sensor.target.css({
        width: sensor.width + "%",
        height: sensor.height + "%",
    });

    // Make the marker element draggable
    sensor.target.draggable({
        containment: "parent", // Keep the marker within its parent element (the board)
        snap: ".cell",         // Snap to elements with the class "cell"
        snapMode: "both"       // Snap to both the x and y axes
        /*
        drag: function (event, ui) {
            onDrag(event, ui, marker); // Pass the marker to onDrag
        }*/
    });

    sensors.push(sensor);

    sensor.target.on("mousedown", function (event) {
        event.preventDefault();
        sensor.isDragging = true;

        var startX = event.clientX;
        var startY = event.clientY;
        var startLeft = parseFloat(sensor.target.css('left')) || 0;
        var startTop = parseFloat(sensor.target.css('top')) || 0;

        document.onmousemove = function (e) {
            if (sensor.isDragging) {
                var newX = startLeft + e.clientX - startX;
                var newY = startTop + e.clientY - startY;
                // Ensure the sensor stays within the board
                newX = Math.min(Math.max(newX, 0), board.width - sensor.width);
                newY = Math.min(Math.max(newY, 0), board.height - sensor.height);

                sensor.target.css({ left: newX + 'px', top: newY + 'px'});

                onDrag(sensor);
            }
        };

        document.onmouseup = function () {
            sensor.isDragging = false;
            document.onmousemove = null;
            document.onmouseup = null;

            board.bounds = null;
            setRelativeSensor(sensor);
            updateLightMap();
        };
    });

    updateLightMap();
}

// Table Sources/Sensors :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

function updateTable(){
    showTable(sources.length,sensors.length);
    var saveLightMap = lightMap;
    var saveActiveLightSources = [];
    for(var i=0;i<sources.length;i++){
        saveActiveLightSources.push(sources[i].active);
    }

    var numberOfIns = sources.length;
    var combis = getCombinations(numberOfIns);
    console.log(combis);

    for(var i=0;i<combis.length;i++) {
        var combi = combis[i];
        for(var e=0;e<combi.length;e++) {
            sources[e].active = combi[e];
            console.log(combi[e]);
        }

        tableUpdateLightMap();
        
        for(var e=0;e<sensors.length;e++) {
            tableOuts[i][e].active = sensors[e].active;
            console.log(sensors[e].active);
        }
    }
    console.log("ahh",tableOuts);
    showTableOuts();

    for(var i=0;i<sources.length;i++){
        sources[i].active = saveActiveLightSources[i];
    }
    lightMap=saveLightMap;
}

function showTable(ins,outs) { // number of inputs and outputs
    // Clears table
    for (var i = tableTarget.rows.length-1; i > -1; i--) {
        tableTarget.deleteRow(i);
    }

    var head = $("<tr> </tr>").appendTo(tableTarget);

    for(var i=0; i<ins; i++) {
        var elem = $("<th>I"+(i+1)+"</th>").appendTo(head);
    }
    for(var i=0; i<outs; i++) {
        var elem = $("<th>O"+(i+1)+"</th>").appendTo(head);
    }
    var insCombinations = getCombinations(ins);
    tableOuts = [];
    for(var r=0; r<insCombinations.length; r++) {
        var row = $("<tr> </tr>").appendTo(tableTarget);
        for(var i=0; i<ins; i++) {
            var elem;
            if(i<ins-1) {
                elem = $("<td> </td>").appendTo(row);
            }
            else{
                elem = $("<td class='divider'> </td>").appendTo(row);
            }
            var activeTarget = $("<div class='custom-marker-table-elem'></div>").appendTo(elem);
            if(insCombinations[r][i]) {
                activeTarget.css({background: "yellow"});
            }
        }
        tableOuts.push([]);
        for(var o=0; o<outs; o++){
            var elem = $("<td> </td>").appendTo(row);
            var activeTarget = $("<div class='custom-marker-table-elem'></div>").appendTo(elem);
            tableOuts[r].push({
                active: false,
                target: activeTarget
            })
        }
    }
}

function tableUpdateLightMap() {
    console.log("before");
    console.log(lightMap);
    lightMap = resetLightMap();
    console.log("adsjkllf");
    console.log(lightMap);
    updateLightMapObstacles();
    var oldMap = lightMap;
    updateLightSources();
    extendLights();
    do {
        oldMap = JSON.parse(JSON.stringify(lightMap)); // Deep copy of lightMap
        updateLightMarkers();
    } while (!arraysEqual(oldMap, lightMap));

    console.log(lightMap);

    updateLightSensors();
}

function showTableOuts() {
    for(var row=0;row<tableOuts.length;row++) {
        for(var out=0;out<tableOuts[0].length;out++) {
            if(tableOuts[row][out].active) {
                tableOuts[row][out].target.css({background: "yellow"});
            }
            else {
                tableOuts[row][out].target.css({background: "lightgray"});
            }
        }
    }
}

// Custom Markers :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

function customMarkerSetUp() {
    customMarkerIndex = -1;

    $(".custom-marker-part").remove();
    customMarkerParts = [];
    $(".custom-marker-color").remove();
    customMarkerNumberOfInputs = 0;
    customMarkerNumberOfOutputs = 0;
    customMarkerShowTable(0,0);
    customMarkerColor = "#ffffff";
    customMarkerShowColors();
    customMarkerNewPart();

    $("#custom-marker-header").html("Create custom Marker");
}

function customMarkerLoad(index) {
    customMarkerIndex = index;

    $(".custom-marker-part").remove();
    customMarkerParts = [];
    $(".custom-marker-color").remove();
    customMarkerColor = markerTypes[index].color;
    customMarkerShowColors();

    customMarkerNumberOfInputs = 0;
    customMarkerNumberOfOutputs = 0;
    for(var i=0;i<markerTypes[index].realHeight;i++) {
        customMarkerNewPart();
    }

    customMarkerShowTable(0,0);
    for(var i=0;i<markerTypes[index].realHeight;i++) {
        if(markerTypes[index].inOut[0][i]) {
            customMarkerActivateInput(i);
        }
        if(markerTypes[index].inOut[1][i]) {
            customMarkerActivateOutput(i);
        }
    }
    customMarkerShowTable(customMarkerNumberOfInputs,customMarkerNumberOfOutputs);

    var rules = markerTypes[index].rules;
    if(rules != []) {
        for(var a=0;a<rules.length;a++) {
            for(var b=0;b<rules[0].length;b++) {
                customMarkerTableOuts[a][b].active = rules[a][b];
                if(customMarkerTableOuts[a][b].active) {
                    customMarkerTableOuts[a][b].target.css({background: "yellow"});
                }
                else {
                    customMarkerTableOuts[a][b].target.css({background: "lightgray"});
                }
            }
        }
    }

    $("#custom-marker-header").html("Edit Marker");
}

function customMarkerAddMarker() {
    if(customMarkerParts.length==0) {
        return;
    }
    var markerType = {
        color: customMarkerColor,
        realWidth: 1,
        realHeight: customMarkerParts.length,
        inOut: customMarkerGetInOut(),
        rules: customMarkerGetRules()
    }
    if(customMarkerIndex==-1) {
        markerTypes.push(markerType);
        var div = $("<div> </div>").appendTo($("#marker-setting-form"));
        $("<button type='button' onclick='createMarker("+(markerTypes.length-1)+",0,0)'> Spawn Custom Marker "+ (markerTypes.length-4) +" </button>").appendTo(div);
        $("<button type='button' onclick='customMarkerLoad("+(markerTypes.length-1)+")'> Edit </button>").appendTo(div);
    }
    else {
        markerTypes[customMarkerIndex] = markerType;
    }


    customMarkerSetUp();
}


function customMarkerNewPart() {
    var index = customMarkerParts.length;
    customMarkerTarget=$("#custom-marker-parts");
    var target = $("<div class='custom-marker-part'></div>").appendTo(customMarkerTarget);
    var inputTarget = $("<button type='button' class='custom-marker-part-in' onclick='customMarkerActivateInput("+index+")'></button>").appendTo(target);
    var outputTarget = $("<button type='button' class='custom-marker-part-out' onclick='customMarkerActivateOutput("+index+")'></button>").appendTo(target);
    var newPart = {
        inputTarget: inputTarget,
        outputTarget: outputTarget,
        target: target,
        input: false,
        output: false
    }
    if(customMarkerParts.length==0) {
        target.css({borderTop: "1px solid black"});
    }
    else {
        customMarkerParts[customMarkerParts.length-1].target.css({borderBottom: 0});
    }
    target.css({background: customMarkerColor, borderBottom: "1px solid black"});
    customMarkerParts.push(newPart);

    customMarkerShowTable(customMarkerNumberOfInputs,customMarkerNumberOfOutputs);
}

function customMarkerDeletePart() {
    if(customMarkerParts.length<=1) {
        return;
    }
    var index = customMarkerParts.length-1;
    customMarkerParts[index].target.remove();
    if(customMarkerParts[index].input) {
        customMarkerNumberOfInputs-=1;
    }
    if(customMarkerParts[index].output) {
        customMarkerNumberOfOutputs-=1;
    }
    customMarkerParts.pop(index);
    console.log(customMarkerNumberOfInputs,customMarkerNumberOfOutputs);

    customMarkerShowTable(customMarkerNumberOfInputs,customMarkerNumberOfOutputs);
}

function customMarkerActivateInput(i) {
    console.log("Input");
    customMarkerParts[i].input= !customMarkerParts[i].input;
    if(customMarkerParts[i].input) {
        customMarkerParts[i].inputTarget.css({background: "green"});
        customMarkerNumberOfInputs+=1;
    }
    else {
        customMarkerParts[i].inputTarget.css({background: "lightgrey"});
        customMarkerNumberOfInputs-=1;
    }
    console.log(customMarkerNumberOfInputs,customMarkerNumberOfOutputs);

    customMarkerShowTable(customMarkerNumberOfInputs,customMarkerNumberOfOutputs);
}

function customMarkerActivateOutput(i) {
    console.log("Output");
    customMarkerParts[i].output= !customMarkerParts[i].output;
    if(customMarkerParts[i].output) {
        customMarkerParts[i].outputTarget.css({background: "red"});
        customMarkerNumberOfOutputs+=1;
    }
    else {
        customMarkerParts[i].outputTarget.css({background: "lightgrey"});
        customMarkerNumberOfOutputs-=1;
    }
    console.log(customMarkerNumberOfInputs,customMarkerNumberOfOutputs);

    customMarkerShowTable(customMarkerNumberOfInputs,customMarkerNumberOfOutputs);
}

function customMarkerShowColors() {
    var colors = [
        "#e06666",
        "#f6b26b",
        "#ffd966",
        "#93c47d",
        "#76a5af"
    ]

    colors = [
        "#F94144", // Salmon Red
        "#F3722C", // Orange
        "#F8961E", // Orange Yellow
        "#F9C74F", // Pastel Yellow
        "#90BE6D", // Pastel Green
        "#43AA8B", // Teal
        "#577590", // Slate Blue
        "#8A58B5",  // Dark Purple
        "#F06292",   // Pastel Pink
        "#FFFFFF", // White
        "#000000", // Black
        "#808080"  // Gray
    ];

    colors = [
        "#EE0000", // Red
        "#FF7F00", // Orange
        "#FFFF00", // Yellow
        "#00DD00", // Green
        "#0066FF", // Blue
        "#8A2BE2",  // Violet
        "#FFFFFF", // White
        "#000000", // Black
        "#808080"  // Gray
    ];

    var colorSelectionTarget = $("#custom-marker-choose-colors");
    for(var i=0; i<colors.length; i++) {
        var target = $("<button type='button' class='custom-marker-color' onclick=\"customMarkerChangeColor('" + colors[i] + "')\"></button>").appendTo(colorSelectionTarget);
        target.css({background: colors[i]});
    }
}

function customMarkerChangeColor(color) {
    for(var i=0;i<customMarkerParts.length;i++) {
        customMarkerParts[i].target.css({background: color});
    }
    customMarkerColor=color;
}

var customMarkerTableOuts = [[
    {
        active: true,
        target: null
    }
]]

var customMarkerTableTarget = $("#custom-marker-table").get(0);

function getCombinations(count) {
    if (count <= 0) return [[]]; // Edge case: an empty combination
    if (count === 1) return [[true], [false]]; // Base case

    // Recursive call to generate combinations
    const smallerCombinations = getCombinations(count - 1);
    
    // Combine with 'true' and 'false' for each smaller combination
    const combinations = [];
    for (const smallerCombination of smallerCombinations) {
        combinations.push([...smallerCombination, true]);
        combinations.push([...smallerCombination, false]);
    }

    return combinations;
}

function customMarkerShowTable(ins,outs) { // number of inputs and outputs
    // Clears table
    for (var i = customMarkerTableTarget.rows.length-1; i > -1; i--) {
        customMarkerTableTarget.deleteRow(i);
    }

    var head = $("<tr> </tr>").appendTo(customMarkerTableTarget);

    for(var i=0; i<ins; i++) {
        var elem = $("<th>I"+(i+1)+"</th>").appendTo(head);
    }
    for(var i=0; i<outs; i++) {
        var elem = $("<th>O"+(i+1)+"</th>").appendTo(head);
    }
    var insCombinations = getCombinations(ins);
    customMarkerTableOuts = [];
    for(var r=0; r<insCombinations.length; r++) {
        var row = $("<tr> </tr>").appendTo(customMarkerTableTarget);
        for(var i=0; i<ins; i++) {
            var elem;
            if(i<ins-1) {
                elem = $("<td> </td>").appendTo(row);
            }
            else{
                elem = $("<td class='divider'> </td>").appendTo(row);
            }
            var activeTarget = $("<div class='custom-marker-table-elem'></div>").appendTo(elem);
            if(insCombinations[r][i]) {
                activeTarget.css({background: "yellow"});
            }
        }
        customMarkerTableOuts.push([]);
        for(var o=0; o<outs; o++){
            var elem = $("<td> </td>").appendTo(row);
            var activeTarget = $("<button type='button' class='custom-marker-table-button' onclick='customMarkerTableChangeOutput("+o+","+r+")'></button>").appendTo(elem);
            customMarkerTableOuts[r].push({
                active: false,
                target: activeTarget
            })
        }
    }
}

function customMarkerTableChangeOutput(out,row) {
    console.log(out,row);
    if(customMarkerTableOuts[row][out].active) {
        customMarkerTableOuts[row][out].target.css({background: "lightgray"});
        customMarkerTableOuts[row][out].active = false;
    }
    else {
        customMarkerTableOuts[row][out].target.css({background: "yellow"});
        customMarkerTableOuts[row][out].active = true;
    }
}

function customMarkerGetRules() {
    var rules = [];
    for(var r=0; r<customMarkerTableOuts.length; r++) {
        rules.push([]);
        for(var o=0; o<customMarkerTableOuts[0].length; o++) {
            rules[r].push(customMarkerTableOuts[r][o].active);
        }
        console.log(rules[r]);
    }
    return(rules);
}

function customMarkerGetInOut() {
    inOut=[[],[],[null],[null]];
    var inCounter = 1;
    var outCounter= 1;
    for(var i=0; i<customMarkerParts.length; i++) {
        if(customMarkerParts[i].input==true) {
            inOut[0].push("I"+inCounter);
            inCounter++;
        }
        else{
            inOut[0].push(null);
        }
        if(customMarkerParts[i].output==true) {
            inOut[1].push("O"+outCounter);
            outCounter++;
        }
        else{
            inOut[1].push(null);
        }
    }
    return(inOut);
}