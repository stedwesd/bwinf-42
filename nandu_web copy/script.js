var board, marker;

var input = {
    width: $("#marker-width"),
    height: $("#marker-height"),
    snapX: $("#snap-x"),
    snapY: $("#snap-y"),
    size: $("#board-size")
};

// INIT :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
function init(event) {

    // prevent when called by submit
    event && event.preventDefault();
    
    // cast input values to numbers
    board.size    = +input.size.val();
    marker.snapX  = +input.snapX.val();
    marker.snapY  = +input.snapY.val();
    marker.width  = +input.width.val();
    marker.height = +input.height.val();
    
    // Set marker's size here
    marker.target.css({
        width: marker.width + "%",
        height: marker.height + "%"
    });
    
    // Make the marker element draggable
    $("#marker").draggable({
        containment: "parent", // Keep the marker within its parent element (the board)
        snap: ".cell",         // Snap to elements with the class "cell"
        snapMode: "both",       // Snap to both the x and y axes
        drag: onDrag
    });
    
    createGrid();
    updateSize();
}

function onDrag(event, ui) {
    console.log("onDrag called");
    
    // Snap the marker to the nearest grid cell within the board
    var xGrid = Math.round(ui.position.left / board.width * board.cols) * (100 / board.cols);
    var yGrid = Math.round(parseFloat(marker.target.css('top')) / board.height * board.rows) * (100 / board.rows);
    console.log(xGrid,yGrid)

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

var winWidth  = window.innerWidth;
var winHeight = window.innerHeight;
var landscape = (winWidth > winHeight);

var min  = Math.min(winWidth, winHeight);
var max  = Math.max(winWidth, winHeight);
var size = board.size * min / 100;

TweenLite.set(board.target, {
    xPercent   : -50,
    yPercent   : -50,
    width      : size / (landscape ? max : min) * 100 + "%",
    paddingTop : size / (landscape ? max : min) * 100 + "%"
});

TweenLite.set(marker.target, {
    width  : marker.width  + "%",
    height : marker.height + "%"
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
                width  : 100 / board.cols + "%",
                height : 100 / board.rows + "%",
                left   : col * 100 / board.cols + "%",
                top    : row * 100 / board.rows + "%"
            });
        }
    }
}


$(document).ready(function () {

    $("#settings-form").on("submit", function (event) {
        event.preventDefault();
        init(event);
    });

    board = {
        _bounds: null,
        size: null,
        target: $("#board"),

        get bounds() { return this._bounds || this.target[0].getBoundingClientRect(); },
        set bounds(bounds) { this._bounds = bounds; },

        get cols() { return Math.floor(100 / marker._snapX); },
        get rows() { return Math.floor(100 / marker._snapY); },

        get width() { return this.bounds.width; },
        get height() { return this.bounds.height; }
    }

    marker = {
        _snapX: null,
        _snapY: null,
        target: $("#marker"),
        width: null,
        height: null,
        xPercent: 0,
        yPercent: 0,

        get snapX() { return this._snapX + 100 % this._snapX / board.cols; },
        set snapX(snapX) { this._snapX = snapX; },

        get snapY() { return this._snapY + 100 % this._snapY / board.rows; },
        set snapY(snapY) { this._snapY = snapY; },

        get x() { return parseFloat(this.target.css('left')) || 0; },
        get y() { return parseFloat(this.target.css('top')) || 0; }
    };

    init();

    var isDragging = false;

    marker.target.on("mousedown", function (event) {
        event.preventDefault();
        isDragging = true;

        var startX = event.clientX;
        var startY = event.clientY;
        var startLeft = parseFloat(marker.target.css('left')) || 0;
        var startTop = parseFloat(marker.target.css('top')) || 0;

        document.onmousemove = function (e) {
            if (isDragging) {
                var newX = startLeft + e.clientX - startX;
                var newY = startTop + e.clientY - startY;

                // Ensure the marker stays within the board
                newX = Math.min(Math.max(newX, 0), board.width - marker.width);
                newY = Math.min(Math.max(newY, 0), board.height - marker.height);

                marker.target.css({ left: newX + 'px', top: newY + 'px' });
            }
        };

        document.onmouseup = function () {
            isDragging = false;
            document.onmousemove = null;
            document.onmouseup = null;

            board.bounds = null;
            setRelative();
        };
    });

    function setRelative() {
        //marker.xPercent = marker.x / board.width * 100;
        //marker.yPercent = marker.y / board.height * 100;

        TweenLite.set(board.target, { zIndex: 10 });
        TweenLite.set(marker.target, {
            left: marker.xPercent + "%",
            top: marker.yPercent + "%"
        });
    }
});