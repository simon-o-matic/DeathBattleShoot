// deathbattleshoot.js
// By Gabe & Simon

$(document).ready(function() {
	initWindow();
	setInterval(worldUpdate, TIMESLICE);
	$(window).resize( initWindow );
});

var shots = []; // direction, weapon, div, location

var Weapon = {
	BOMB: {speed: 25, cost: 100, image: "images/deathbomb.png"},
	CLOUD: {speed: 13, cost: 20, image: "images/deathcloud.png"},
	SHOCK: {speed: 60, cost: 45, image: "images/deathshock.png", rotates: true},
	STAR: {speed: 30, cost: 70, image: "images/deathstar.png", rotates: true},
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
var POWER_SPEED = 20; // the replenishment rate

var LeftDude = {
	score: 	0,
	power: 	150,
	div: 	"#left_dude"
}

var RightDude = {
	score: 	0,
	power: 	150,
	div: 	"#right_dude"
}

function worldUpdate() {
	moveTheWorld();
	checkCollisions();
	updatePower();
}

// TODO: change the time system to work on elapsed total
function moveTheWorld() {
	// Move and check destination
	for (s = shots.length-1; s > -1; s--) {
		var shot = shots[s];
		shot.location += shot.weapon.speed*shot.direction*(TIMESLICE/1000);
		
		// move the shot
		$(shot.div).css("left", shot.location);

		// check if hit the dude
		if (shot.location > START_RIGHT || shot.location < START_LEFT) {
			hit(shot);
			shots.splice(s,1);
			document.body.removeChild(shot.div);
		}
	}
}

function updatePower() {
	if (RightDude.power < 150) RightDude.power += POWER_SPEED*(TIMESLICE/1000);
	if (LeftDude.power < 150) LeftDude.power += POWER_SPEED*(TIMESLICE/1000);

	$("#left_power").css("width", LeftDude.power);
	$("#right_power").css("width", RightDude.power);
}

/**
 * Bubble every one moving to the right
 * then bubble everyone moving to the left
 * switch it along until it finds its spot
 * The pieces must be ordered by position for this to work.
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
					// passing own guy. Interestions options here for the game.
					//console.log("passing");
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

 	// Move things from the right
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
					// passing own guy
					//console.log("passing");
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
	// to start with kill them if they are the same type
	if (shots[i].weapon == shots[i+1].weapon) {
		shots[i].destroy = true;
		shots[i+1].destroy = true;

		var boom = createBoom(shots[i].location);
		$(boom).tween({"background-size":{start: 50, stop: 300, time: 0, duration: 1, units: 'px', effect: 'easeOut',
			onStop: function() {
				document.body.removeChild(boom); 							
			}
		}});
		$.play();
	}
}

function hit(shot) {
	var hiter, hitee;
	if (shot.direction == Direction.RIGHT) {
		hitee = RightDude;
		hiter = LeftDude;
	} else {
		hitee = LeftDude;
		hiter = RightDude;
	}

	hiter.score += shot.weapon.cost;
	showScores();	
	
	// Flash hitee
	// THIS TIMEOUT FREEZES THE UI. No idea why. Experimented with a bunch of things.
	$(hitee.div).css("opacity", "0.5");
	setTimeout(function() {$(hitee.div).css("opacity", "1");}, 1);
}

function showScores() {
	$("#left_score").html(LeftDude.score);
	$("#right_score").text(RightDude.score);
}

function fire(thing, dir) {
	return function() {
		var dude = (dir == Direction.RIGHT)? LeftDude:RightDude;
		if (dude.power < thing.cost) return;
		dude.power -= thing.cost;

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
	// make sure things move when the screen size changes
	HEIGHT = $(document).height(); 
	WIDTH = $(document).width();

	// fixed positions on the screen for animations to start and end.
	START_LEFT = 300,
	START_RIGHT = WIDTH-300,
	SHOT_HEIGHT = HEIGHT-260;

	showScores();
}


