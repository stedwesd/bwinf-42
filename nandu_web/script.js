var board;
var markers = [];
var sources = [];
var lights = [];
var snapX, snapY;
var lightMap = []; // 0: nothing, 1: obstacle, 2: horizontal light, 3: vertical light, 4: crossing lights

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
    console.log(marker.width,marker.realWidth)
    console.log(marker.height,marker.realHeight)
    marker.inOutTargets=[[],[],[],[]]
    for(var c=0; c<4; c++) {
        for(var i=0; i<s[c].length; i++) {
            if(s[c][i]!=null) {
                console.log(c,i,(100*(c-2))-10/marker.realHeight);
                var target;
                if(s[c][i][0]=="I") {
                    target = $("<div class='in' />").appendTo(marker.target);
                }
                if(s[c][i][0]=="O") {
                    target = $("<div class='out' />").appendTo(marker.target);
                }
                if(c<=1) {
                    target.css({
                        left: (100*c)-10/marker.realWidth + "%",
                        top: 100/marker.realHeight*i+25/marker.realHeight + "%",
                        width: 20/marker.realWidth + "%",
                        height: 50/marker.realHeight + "%"
                    });
                }
                else {
                    target.css({
                        left: 100/marker.realWidth*i+25/marker.realWidth + "%",
                        top: (100*(c-2))-10/marker.realHeight + "%",
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
    console.log(marker.inOutTargets);
    

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
                    left: (100*c)-10 + "%",
                    top: 25 + "%",
                    width: 20 + "%",
                    height: 50 + "%"
                });
            }
            else {
                target.css({
                    left: 25 + "%",
                    top: (100*(c-2))-10 + "%",
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
    resetLightMap();
    deleteLights();
    updateLightMapObstacles();
    var oldMap = lightMap;
    updateLightSources();
    do {
        oldMap = JSON.parse(JSON.stringify(lightMap)); // Deep copy of lightMap
        extendLights();
        updateLightMarkers();
    } while (!arraysEqual(oldMap, lightMap));
}

function resetLightMap() {
    lightMap = [];
    for(var y=0; y<board.rows; y++) {
        var subList = [];
        for(var x=0; x<board.cols; x++) {
            subList.push(0);
        }
        lightMap.push(subList);
    }
}

function deleteLights() {
    $(".horizontal-light").remove();
    $(".vertical-light").remove();
    lights=[];
}

function updateLightMapObstacles(){
    markers.forEach(function (marker) {
        var pos={
            x: marker.xPercent/100*board.cols,
            y: marker.yPercent/100*board.rows
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
        lightMap[source.yPercent/100*board.rows][source.xPercent/100*board.cols] = 1;
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
                    pos = [source.xPercent/100*board.cols+2*i-1,source.yPercent/100*board.rows];
                    newLight(0,pos);
                }
                else {
                    pos = [source.xPercent/100*board.cols,source.yPercent/100*board.rows+2*(i-2)-1];
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
    markers.forEach(function (marker) {
        console.log("ihi");
        var pos={
            x: marker.xPercent/100*board.cols,
            y: marker.yPercent/100*board.rows
        };
        var size={
            x: marker.realWidth,
            y: marker.realHeight
        };
        console.log(pos);

        // Get positions of space at input and output
        var inOut = marker.inOut;
        var ins = [];
        var outs = [];
        for(var c=0; c<4; c++) {
            for(var i=0; i<inOut[c].length; i++) {
                console.log("oho");
                if(inOut[c][i] != null) {
                    console.log("aha");
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
                        console.log(number,element);
                        ins[number-1]=element;
                    }
                    else{
                        outs[number-1]=element;
                    }
                }
            }
        }
        
        for(var i=0; i<10;i++) {
            console.log(lightMap[i]);
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
        console.log(activeIns);

        // Use rules to get the active outputs
        var index = 0;
        for(var i=0; i<ins.length; i++) {
            index+=activeIns[i]*(Math.pow(2, ins.length-i-1));
        }
        activeOuts = marker.rules[index];

        // Summon new light at active outputs
        for(var i=0; i<activeOuts.length; i++) {
            if(activeOuts[i]){
                console.log(i);
                newLight(outs[i][0],[outs[i][1],outs[i][2]]);
            }
        }
    });
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
    else {
        newLight = $("<div class='vertical-light' />").appendTo(board.target);
        newLight.css({
            left: (pos[0]+0.4)*100/board.cols + "%",
            top: pos[1]*100/board.rows + "%",
            width: 20/board.cols + "%",
            height: 100/board.rows + "%"
        })
    }

    var light = {
        x: pos[0],
        y: pos[1],
        type: type,
        target: newLight
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

    resetLightMap();

    /*
    var markerTargets = board.target.find(".marker");

    markerTargets.each(function () {
        var marker = {
            isDragging: false,
            target: $(this),
            width: null,
            height: null,
            realWidth: 1,
            realHeight: 2,
            xPercent: 0,
            yPercent: 0,
            inOut: [["I1","I2"],["O1","O2"],[null],[null]], // left, right, top, bottom
            inOutTargets: [],
            rules: null,
            color: "purple"
        };
        marker.width = 10;
        marker.height = 20;
        markers.push(initMarker(marker));
    });

    markers.forEach(function (marker) {
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
                setRelative(marker);
            };
        });
    });
    // Delete until here */
});

// Function to set the marker's relative position
function setRelative(marker) {
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

// Functions:::::::::::::::::::::::::::::::::
function createMarker(xPercent, yPercent) {
    var newMarker = $("<div class='marker' />").appendTo(board.target);
    
    // Initialize the new marker
    var marker = {
        isDragging: false,
        target: newMarker,
        width: null,
        height: null,
        realWidth: null,
        realHeight: null,
        xPercent: xPercent,
        yPercent: yPercent,
        inOut: [["I1","I2"],["O1","O2"],[null],[null]], // left, right, top, bottom
        inOutTargets: [],
        rules: type.rules,
        color: type.color
    };

    marker.realWidth = $("#marker-width").val();
    marker.realHeight = $("#marker-height").val();
    marker.width=snapX*realWidth;
    marker.height=snapY*realHeight;

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
            setRelative(marker);
        };
    });
}

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
        color: "red",
        realWidth: 1,
        realHeight: 2,
        inOut: [["I1",null],["O1","O2"],[null],[null]],
        rules: [
            [false,false], // Input: true
            [true,true] // Input: false
        ]
    },
    {
        color: "red",
        realWidth: 1,
        realHeight: 2,
        inOut: [[null,"I1"],["O1","O2"],[null],[null]],
        rules: [
            [false,false], // Input: true
            [true,true] // Input: false
        ]
    },
    {
        color: "blue",
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
            setRelative(marker);
        };
    });

    updateLightMap();
}

function createSource(outs,xPercent,yPercent) {
    var newSource = $("<div class='source' />").appendTo(board.target);
    
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
            setRelative(source);
            updateLightMap();
        };
    });

    updateLightMap();
}