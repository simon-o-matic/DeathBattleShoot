// deathbattleshoot.js

$(document).ready(function() {
	initWindow();
	
	setInterval(worldUpdate, TIMESLICE);
	$(window).resize( initWindow );
});

var shots = []; // direction, weapon, div, location

var Weapon = {
	BOMB: {speed: 25, image: "images/deathbomb.png"},
	CLOUD: {speed: 13, image: "images/deathcloud.png"},
	SHOCK: {speed: 60, image: "images/deathshock.png", rotates: true},
	STAR: {speed: 30, image: "images/deathstar.png", rotates: true},
}

var Direction = { RIGHT: 1, LEFT: -1}

var WIDTH = 800,
	START_LEFT = 100,
	START_RIGHT = WIDTH-100,
	SHOT_HEIGHT = 400;

Mousetrap.bind("a", fire(Weapon.STAR, Direction.RIGHT));
Mousetrap.bind("z", fire(Weapon.SHOCK, Direction.RIGHT));
Mousetrap.bind("s", fire(Weapon.CLOUD, Direction.RIGHT));
Mousetrap.bind("x", fire(Weapon.BOMB, Direction.RIGHT));

Mousetrap.bind("'", fire(Weapon.STAR, Direction.LEFT));
Mousetrap.bind("/", fire(Weapon.SHOCK, Direction.LEFT));
Mousetrap.bind(";", fire(Weapon.CLOUD, Direction.LEFT));
Mousetrap.bind(".", fire(Weapon.BOMB, Direction.LEFT));

var TIMESLICE = 50; // millis

// x = v*t
function worldUpdate() {
	moveTheWorld();
	checkCollisions();
}

// TODO: change the time system to work on elapsed total
function moveTheWorld() {
	// Move and check destination
	for (s = shots.length-1; s > -1; s--) {
		var shot = shots[s];
		shot.location += shot.weapon.speed*shot.direction*(TIMESLICE/1000);
		
		$(shot.div).css("left", shot.location);

		// check if hit the person
		if (shot.location > START_RIGHT || shot.location < START_LEFT) {
			hit();
			shots.splice(s,1);
			document.body.removeChild(shot.div);
		}
	}
}
/**
	bubble every one moving to the right
	then bubble everyone moving to the left
	switch it along until it finds its spot
*/
function checkCollisions() {
	// check left to right
	for (r = 0; r < shots.length-1; r++) { // don't do the last one
		if (shots[r].direction != Direction.RIGHT) continue;

		var rightSpot = false;
		var i = r;
		while (!rightSpot && i < shots.length-1) {
			if (shots[i].location > shots[i+1].location) {
				// collision or passing
				if (shots[i+1].direction == Direction.LEFT) {
					if (processCollision(i)) break;
				} else {
					// passing own - switch
					console.log("passing");
				}
				var tmp = shots[i+1];
				shots[i+1] = shots[i];
				shots[i] = tmp;
			} else {
				rightSpot = true;
			}
			i++;
		}
 	}	

 	// TODO: do this for left moving objects. Othwerise, ther are some cases
 	// when things will be missed.
	for (r = shots.length-1; r > 0; r--) { // don't do the last one
		if (shots[r].direction != Direction.LEFT) continue;

		var rightSpot = false;
		var i = r;
		while (!rightSpot && i > 0 ) {
			if (shots[i].location < shots[i-1].location) {
				// collision or passing
				if (shots[i-1].direction == Direction.RIGHT) {
					if (processCollision(i)) break;
				} else {
					// passing own - switch
					console.log("passing");
				}
				var tmp = shots[i-1];
				shots[i-1] = shots[i];
				shots[i] = tmp;
			} else {
				rightSpot = true;
			}
			i--;
		}
 	}	

 	// remove the destroyed shots
 	for (r = shots.length-1; r>= 0; r--) {
 		if (shots[r].destroy) {
			document.body.removeChild(shots[r].div); 			
			shots.splice(r,1);
 		}
 	}
}

function processCollision(i) {
	console.log("boom");
	// to start with kill them if they are the same type
	if (shots[i].weapon == shots[i+1].weapon) {
		shots[i].destroy = true;
		shots[i+1].destroy = true;

		var boom = createBoom(shots[i].location);
		$(boom).tween(
			{
				"background-size":{start: 50, stop: 300, time: 0, duration: 1, units: 'px', effect: 'easeOut',
					onStop: function() {
						document.body.removeChild(boom); 							
					}
				}
				//width: {start: 50, stop: 300, time: 0, duration: 1, units: 'px', effect: 'easeOut'}
			}
		);
		$.play();
	}
}

function hit() {
	console.log("HIT!");
}

var shotReady = [];
shotReady[Direction.RIGHT] = true;
shotReady[Direction.LEFT] = true;

function fire(thing, dir) {
	return function() {
		if (!shotReady[dir]) return;


		var startingLocation = (dir == Direction.RIGHT)?START_LEFT:START_RIGHT;
		var newShot = {
			direction: dir,
			location: startingLocation,
			weapon: thing,
			div: createShot(thing.image, startingLocation)
		}

		if (dir == Direction.RIGHT) {
			shots.unshift(newShot);
		} else {
			shots.push(newShot);	
		}

		shotReady[dir] = false;
		setTimeout(function() {shotReady[dir] = true}, 3000);
	}
}

function createBoom(leftPos) {
	var div = document.createElement('div');
	$(div).css({
		background: 		"url(images/boom.png) no-repeat center center",
		"background-size": 	"50px Auto",
		top: 				SHOT_HEIGHT-130,
		left: 				leftPos-120,
		height: 			"300px",
		width: 				"300px",
		position: 			"absolute", 	
	});

	$(document.body).append(div);

	return div;
}

function createShot(image, left) {
		// create a new div with an image
	var div = document.createElement('div');
	var img = document.createElement('img');
	img.src = image;
	img.height = 50;
	img.width = 50;

	$(div).css({
		"top": SHOT_HEIGHT,
		"left": left+"px",
		"position": "absolute"
	});

	div.appendChild(img);
	$(document.body).append(div);

	return div;
}

function initWindow() {
	console.log("Initializing the size of everything");
	
	var dude_width = 400;
	var dude_height = 400;

	HEIGHT = $(document).height(); 
	WIDTH = $(document).width();

	START_LEFT = 300,
	START_RIGHT = WIDTH-300,
	SHOT_HEIGHT = HEIGHT-260;

	$("#left_dude").css({
		left: -10,
		top: HEIGHT-450
	}); 

	$("#right_dude").css({
		left: WIDTH-dude_width,
		top: HEIGHT-dude_height
	}); 
}


