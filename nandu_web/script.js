var board;
var markers = [];
var snapX, snapY;

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

function onDrag(/*event, ui, */marker) {
    // Snap the marker to the nearest grid cell within the board
    // var xGrid = Math.round(ui.position.left / board.width * board.cols) * (100 / board.cols);
    var xGrid = Math.round(parseFloat(marker.target.css('left')) / board.width * board.cols) * (100 / board.cols);
    var yGrid = Math.round(parseFloat(marker.target.css('top')) / board.height * board.rows) * (100 / board.rows);

    // Set the marker's position to the snapped values in percentages
    marker.target.css({
        left: xGrid + "%",
        top: yGrid + "%"
    });

    // Update the marker's xPercent and yPercent
    marker.xPercent = xGrid;
    marker.yPercent = yGrid;
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
            color: "purple",
            activeIns: [],
            activeOuts: []
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

    init(); // Initialize the board
});

// Function to set the marker's relative position
function setRelative(marker) {
    TweenLite.set(board.target, { zIndex: 10 });
    TweenLite.set(marker.target, {
        left: marker.xPercent + "%",
        top: marker.yPercent + "%"
    });
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
        color: type.color,
        activeIns: [],
        activeOuts: []
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
        color: "blue",
        realWidth: 1,
        realHeight: 2,
        inOut: [["I1","I2"],["O1","O2"],[null],[null]],
        rules: [
            [true,true],
            [true,false],
            [false,true],
            [false,false]
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
        activeIns: [],
        activeOuts: []
    };

    s=type.inOut;
    for(var c=0; c<4; c++) {
        for(var i=0; i<type.inOut[c].length; i++) {
            if(s[c][i]!=null) {
                if(s[c][i][0]=="I") {
                    marker.activeIns.push(false);
                }
                if(s[c][i][0]=="O") {
                    marker.activeOuts.push(false);
                }
            }
        }
    }

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