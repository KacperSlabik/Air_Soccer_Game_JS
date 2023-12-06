let board = document.getElementById('canvas'),
	boardContext = board.getContext('2d'),
	boardWidth = 1500,
	boardHeight = 750,
	boardCenterX = boardWidth / 2,
	boardCenterY = boardHeight / 2,
	controllers = [],
	goalHeight = 250;
(goalPosTop = (boardHeight - goalHeight) / 2), (score = []);

let gameState = {
	playerOneName: '',
	playerTwoName: '',
	playerOneGoals: 0,
	playerTwoGoals: 0,
	matchTime: 60,
	timeInterval: null,
	currentTime: 0,
	isGameFinished: false,
	isGoalScored: false,
	isDraw: false,
	isOvertime: false,
};

const kickSound = document.getElementById('kickSound');
const crowdCheerSound = document.getElementById('crowdCheerSound');
const startWhistle = document.getElementById('startWhistle');
const goalSound = document.getElementById('goalSound');
const hitSound = document.getElementById('hitSound');
const endMatchSound = document.getElementById('matchEndSound');
const matchSound = document.getElementById('matchSound');
const winSound = document.getElementById('winSound');
const goalNetSound = document.getElementById('goalNetSound');
const countdownSound = document.getElementById('countdownSound');
const menuSound = document.getElementById('menuSound');

const alertDiv = document.querySelector('#game-alerts');
const playerOneGoalsElement = document.querySelector('#player-one-score'),
	playerTwoGoalsElement = document.querySelector('#player-two-score'),
	gameTime = document.querySelector('.game-time');

// Ustaw szerokość i wysokość dla canvas
board.width = boardWidth;
board.height = boardHeight;

// Ustawienia canvas dla dzialania klawiatury
board.focus();

// Kontroler (Dysk)
function Disc() {
	this.startingPosX = boardCenterX;
	this.startingPosY = boardCenterY;
	this.x = this.startingPosX;
	this.y = this.startingPosY;
	this.radius = 25;
	this.mass = 15;
	this.velocityX = 0;
	this.velocityY = 0;
	this.maxSpeed = 20;
	this.frictionX = 0.997;
	this.frictionY = 0.997;
	this.acceleration = 1;
	this.color = '#ffffff';

	(this.keepControllerInBoard = function () {
		if (this.x > boardWidth - this.radius || this.x < this.radius) {
			if (this.x < this.radius) {
				this.velocityX = 2;
			} else {
				this.velocityX = -2;
			}
		}

		if (this.y > boardHeight - this.radius || this.y < this.radius) {
			if (this.y < this.radius) {
				this.velocityY = 2;
			} else {
				this.velocityY = -2;
			}
		}

		if (
			controller.x > boardCenterX - controller.radius &&
			controller.x < boardCenterX
		) {
			controller.velocityX = -3;
		}

		if (
			controllerTwo.x > boardCenterX &&
			controllerTwo.x < boardCenterX + controllerTwo.radius
		) {
			controllerTwo.velocityX = +3;
		}
	}),
		(this.keepPuckInBoard = function () {
			if (this.x > boardWidth + 2 * this.radius || this.x < -2 * this.radius) {
				puck = new Disc(boardCenterX, boardCenterY);
				setGoal(this.x);
				goalNetSound.play();
				return;
			}

			if (this.x > boardWidth - this.radius || this.x < this.radius) {
				if (
					(this.y > 0 && this.y < goalPosTop + this.radius) ||
					(this.y > goalPosTop + (goalHeight - puck.radius) &&
						this.y < boardHeight)
				) {
					hitSound.play();
					if (this.x > boardWidth - this.radius) {
						this.x = boardWidth - this.radius;
						hitSound.play();
					} else {
						this.x = this.radius;
					}

					if (
						!(
							(this.y > 0 && this.y < goalPosTop + this.radius) ||
							(this.y > goalPosTop + (goalHeight - puck.radius) &&
								this.y < boardHeight)
						)
					) {
						puck = new Disc(boardCenterX, boardCenterY);
						setGoal(this.x);
					} else {
						this.velocityX = -this.velocityX;
					}
				}
			}

			if (this.y > boardHeight - this.radius || this.y < this.radius) {
				hitSound.play();
				if (this.y > boardHeight - this.radius) {
					this.y = boardHeight - this.radius;
				} else {
					this.y = this.radius;
					hitSound.play();
				}

				this.velocityY = -this.velocityY;
			}
		});

	this.discCollision = function () {
		for (let i = 0; i < controllers.length; i++) {
			let distanceX = this.x - controllers[i].x,
				distanceY = this.y - controllers[i].y,
				distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY),
				addedRadius = this.radius + controllers[i].radius;

			if (distance < addedRadius) {
				let angle = Math.atan2(distanceY, distanceX),
					sin = Math.sin(angle),
					cos = Math.cos(angle),
					pos0 = {
						x: 0,
						y: 0,
					},
					pos1 = rotate(distanceX, distanceY, sin, cos, true),
					vel0 = rotate(
						controllers[i].velocityX,
						controllers[i].velocityY,
						sin,
						cos,
						true
					),
					vel1 = rotate(this.velocityX, this.velocityY, sin, cos, true),
					velocityXTotal = vel0.x - vel1.x;

				vel0.x =
					((controllers[i].mass - this.mass) * vel0.x +
						2 * this.mass * vel1.x) /
					(controllers[i].mass + this.mass);
				vel1.x = velocityXTotal + vel0.x;

				let absV = Math.abs(vel0.x) + Math.abs(vel1.x),
					overlap =
						controllers[i].radius + this.radius - Math.abs(pos0.x - pos1.x);

				pos0.x += (vel0.x / absV) * overlap;
				pos1.x += (vel1.x / absV) * overlap;

				let pos0F = rotate(pos0.x, pos0.y, sin, cos, false),
					pos1F = rotate(pos1.x, pos1.y, sin, cos, false);

				this.x = controllers[i].x + pos1F.x;
				this.y = controllers[i].y + pos1F.y;
				controllers[i].x = controllers[i].x + pos0F.x;
				controllers[i].y = controllers[i].y + pos0F.y;

				let vel0F = rotate(vel0.x, vel0.y, sin, cos, false),
					vel1F = rotate(vel1.x, vel1.y, sin, cos, false);

				controllers[i].velocityX = vel0F.x;
				controllers[i].velocityY = vel0F.y;

				this.velocityX = vel1F.x;
				this.velocityY = vel1F.y;

				kickSound.play();
			}
		}
	};

	// Rysuj kontroler
	this.draw = function () {
		boardContext.shadowColor = 'rgba(50, 50, 50, 0.25)';
		boardContext.shadowOffsetX = 0;
		boardContext.shadowOffsetY = 3;
		boardContext.shadowBlur = 6;

		boardContext.beginPath();
		boardContext.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
		boardContext.fillStyle = this.color;
		boardContext.fill();

		boardContext.strokeStyle = this.border;
		boardContext.lineWidth = 5;
		boardContext.stroke();

		boardContext.fill();
	};

	// Ruch kontrolera z zastosowaniem fizyki
	this.move = function () {
		this.velocityX *= this.frictionX;
		this.velocityY *= this.frictionY;

		// Aktualizacja poozycji
		this.x += this.velocityX;
		this.y += this.velocityY;
	};

	// Graj przeciwko komputerowi
	this.computerPlayer = function () {
		if (
			puck.x > boardCenterX - 30 &&
			controllerTwo.x > boardCenterX + controllerTwo.radius * 2
		) {
			if (puck.x + puck.radius < controllerTwo.x) {
				controllerTwo.velocityX -= controllerTwo.acceleration;
			} else {
				controllerTwo.velocityX += controllerTwo.acceleration;
			}

			if (puck.y < controllerTwo.y) {
				controllerTwo.velocityY -= controllerTwo.acceleration;
			} else {
				controllerTwo.velocityY += controllerTwo.acceleration;
			}
		} else {
			if (
				controllerTwo.x > controllerTwo.startingPosX - 25 &&
				controllerTwo.x < controllerTwo.startingPosX + 25
			) {
				controllerTwo.velocityX = 0;
			} else if (controllerTwo.x < controllerTwo.startingPosX - 80) {
				controllerTwo.velocityX += controllerTwo.acceleration;
			} else {
				controllerTwo.velocityX -= controllerTwo.acceleration;
			}
		}
	};
}

function setGoal(ballPosition) {
	let scoringPlayer = '';

	if (ballPosition > boardWidth / 2) {
		gameState.playerOneGoals++;
		playerOneGoalsElement.innerHTML = gameState.playerOneGoals;
		scoringPlayer = gameState.playerOneName;
		showGoalAlert(scoringPlayer);
	} else {
		gameState.playerTwoGoals++;
		playerTwoGoalsElement.innerHTML = gameState.playerTwoGoals;
		scoringPlayer = gameState.playerTwoName;
		showGoalAlert(scoringPlayer);
	}

	crowdCheerSound.currentTime = 0;
	goalSound.currentTime = 0;

	crowdCheerSound.play();
	goalSound.play();
	setTimeout(() => {
		crowdCheerSound.pause();
		goalSound.pause();
	}, 4000);

	gameState.isGoalScored = true;

	resetDiscs();
	clearInterval(gameState.timeInterval);

	setTimeout(() => {
		gameState.isGoalScored = false;
		gameState.timeInterval = setInterval(setGameTime, 1000);
		startWhistle.play();

		if (
			gameState.isOvertime &&
			gameState.playerOneGoals !== gameState.playerTwoGoals
		) {
			gameState.isGameFinished = true;
			clearInterval(gameState.timeInterval);
			showWinAlert(gameState.playerOneGoals, gameState.playerTwoGoals);
			startWhistle.play();

			matchSound.pause();

			setTimeout(() => {
				endMatchSound.play();
			}, 1000);

			setTimeout(() => {
				winSound.play();
			}, 2000);
		}
	}, 3000);
}

function showGoalAlert(scoringPlayer) {
	alertDiv.style.display = 'flex';
	alertDiv.textContent = `${scoringPlayer} SCORES!`;

	setTimeout(() => {
		alertDiv.style.display = 'none';
	}, 3000);
}

const formatTime = (time) => {
	const minutes = Math.floor(time / 60);
	const remainingSeconds = time % 60;

	return (
		minutes.toString().padStart(2, '0') +
		':' +
		remainingSeconds.toString().padStart(2, '0')
	);
};

// Ustaw czas gry
function setGameTime() {
	++gameState.currentTime;

	if (gameState.isOvertime) {
		gameState.matchTime = 600;
		gameTime.innerHTML = '+' + formatTime(gameState.currentTime);
		alertDiv.style = 'flex';
		alertDiv.textContent = 'GOLDEN GOAL';
	} else {
		let timeLeft = gameState.matchTime - gameState.currentTime;

		gameTime.innerHTML = formatTime(timeLeft);

		if (timeLeft <= 0) {
			if (gameState.playerOneGoals === gameState.playerTwoGoals) {
				gameState.isDraw = true;
				gameState.isGoalScored = true;
				gameState.isOvertime = true;
				gameState.isGameFinished = false;

				resetDiscs();
				clearInterval(gameState.timeInterval);
				isOvertime();
				startWhistle.play();
			} else {
				gameState.isGameFinished = true;
				clearInterval(gameState.timeInterval);
				showWinAlert(gameState.playerOneGoals, gameState.playerTwoGoals);
				matchSound.pause();
				endMatchSound.play();

				setTimeout(() => {
					winSound.play();
				}, 1000);
			}
		}
	}
}

function isOvertime() {
	alertDiv.style.display = 'flex';
	alertDiv.textContent = 'OVERTIME!';

	gameState.currentTime = 0;
	gameTime.innerHTML = '+' + '00:00';

	setTimeout(() => {
		alertDiv.style.display = 'none';
		gameState.isGoalScored = false;
		gameState.timeInterval = setInterval(setGameTime, 1000);
		startWhistle.play();
	}, 3000);
}

let countdownPosition = countdownSound.currentTime;

// Aktualizacja po starcie gry
function updateGame() {
	let timeLeft = gameState.matchTime - gameState.currentTime;
	let playerVsComputerCheckbox = document.getElementById('player-vs-computer');
	let restartButton = document.getElementById('restart');

	let countdownPosition = countdownSound.currentTime;

	if (timeLeft <= 10 && !gameState.isGameFinished && !gameState.isOvertime) {
		if (!gameState.isGoalScored) {
			countdownSound.play();
		} else {
			countdownSound.pause();
		}

		console.log(countdownSound.currentTime);
	}

	if (gameState.isGoalScored) {
		requestAnimationFrame(updateGame);
		return;
	}

	// Wyczysc tablice
	boardContext.clearRect(0, 0, boardWidth, boardHeight);
	// Krazek
	puck.draw();
	puck.move();
	puck.discCollision();
	puck.keepPuckInBoard();

	// Kontrolery
	controller.draw();
	controller.move();
	controller.keepControllerInBoard();

	if (playerVsComputerCheckbox.checked == true) {
		controllerTwo.computerPlayer();
		controllerTwo.maxSpeed = 20;
		controllerTwo.acceleration = 0.4;
	} else {
		controllerTwo.acceleration = 5;
	}

	controllerTwo.draw();
	controllerTwo.move();
	controllerTwo.keepControllerInBoard();

	// Sprawdzaj czy gra nie jest zakonczona w petli
	if (!gameState.isGameFinished) requestAnimationFrame(updateGame);
	else {
		showWinAlert(gameState.playerOneGoals, gameState.playerTwoGoals);
		restartButton.style.display = 'block';
		document.getElementById('restart').onclick = function () {
			restart();
		};

		countdownSound.pause();
		matchSound.pause();

		if (gameState.isOvertime == false) {
			endMatchSound.play();

			setTimeout(() => {
				winSound.play();
			}, 2000);
		}
	}
}

// Restart gry
function restart() {
	gameState = {
		playerOneGoals: 0,
		playerTwoGoals: 0,
		matchTime: 60,
		timeInterval: null,
		currentTime: 0,
		isGameFinished: false,
		isGoalScored: false,
		isDraw: false,
		isOvertime: false,
	};

	alertDiv.innerHTML = '';
	playerOneGoalsElement.innerHTML = gameState.playerOneGoals;
	playerTwoGoalsElement.innerHTML = gameState.playerTwoGoals;

	resetDiscs();
	startGame();
}

// Wyswietl wygranego gracza
function showWinAlert(playerOneGoals, playerTwoGoals) {
	let winningPlayer;
	alertDiv.style.display = 'flex';

	if (playerOneGoals > playerTwoGoals) {
		winningPlayer = gameState.playerOneName;
		alertDiv.textContent = winningPlayer + ' WINS!';
	} else if (playerOneGoals < playerTwoGoals) {
		winningPlayer = gameState.playerTwoName;
		alertDiv.textContent = winningPlayer + ' WINS!';
	} else {
		alertDiv.textContent = 'DRAW!';
	}
}

// Zdarzenia klawiatury dla strzałek
function moveControllerTwo(key) {
	// Up
	if (key === 38 && controllerTwo.velocityY > -controllerTwo.maxSpeed) {
		controllerTwo.velocityY -= controllerTwo.acceleration;
	}

	// Down
	if (key === 40 && controllerTwo.velocityY < controllerTwo.maxSpeed) {
		controllerTwo.velocityY += controllerTwo.acceleration;
	}

	// Right
	if (key === 39 && controllerTwo.velocityX < controllerTwo.maxSpeed) {
		controllerTwo.velocityX += controllerTwo.acceleration;
	}

	// Left, decrease acceleration
	if (key === 37 && controllerTwo.velocityX > -controllerTwo.maxSpeed) {
		controllerTwo.velocityX -= controllerTwo.acceleration;
	}
}

// Zdarzenia klawiatury dla WASD
function moveController(key) {
	// Up (W)
	if (key === 87 && controller.velocityY > -controller.maxSpeed) {
		controller.velocityY -= controller.acceleration;
	}

	// Down (S)
	if (key === 83 && controller.velocityY < controller.maxSpeed) {
		controller.velocityY += controller.acceleration;
	}

	// Right (D)
	if (key === 68 && controller.velocityX < controller.maxSpeed) {
		controller.velocityX += controller.acceleration;
	}

	// Left (A)
	if (key === 65 && controller.velocityX > -controller.maxSpeed) {
		controller.velocityX -= controller.acceleration;
	}
}

function rotate(x, y, sin, cos, reverse) {
	return {
		x: reverse ? x * cos + y * sin : x * cos - y * sin,
		y: reverse ? y * cos - x * sin : y * cos + x * sin,
	};
}

function resetDiscs() {
	// Przywróć puck do pierwotnej pozycji
	puck = new Disc();

	puck.velocityX = 0;
	puck.velocityY = 0;

	// Przywróć kontrolery do pierwotnej pozycji
	controller.x = controller.startingPosX;
	controller.y = controller.startingPosY;
	controller.velocityX = 0;
	controller.velocityY = 0;

	controllerTwo.x = controllerTwo.startingPosX;
	controllerTwo.y = controllerTwo.startingPosY;
	controllerTwo.velocityX = 0;
	controllerTwo.velocityY = 0;
}

// Dodaj krązek
let puck = new Disc();

// Dodaj kontroler i jego ustawienia
let controller = new Disc();
controller.color = '#FF0000';
controller.border = 'solid #000000';
controller.radius += 10;
controller.acceleration = 5;
controller.startingPosX = 125;
controller.mass = 50;
controller.x = controller.startingPosX;

// Dodaj kontroler drugi
let controllerTwo = new Disc();
controllerTwo.color = '#0000FF';
controllerTwo.border = 'solid #000000';
controllerTwo.radius += 10;
controllerTwo.mass = 50;
controllerTwo.startingPosX = boardWidth - 125;
controllerTwo.acceleration = 0.2;
controllerTwo.x = controllerTwo.startingPosX;

// Przechowaj kontrolery
controllers.push(controller, controllerTwo);

document.addEventListener('keydown', function (e) {
	moveController(e.keyCode);
	moveControllerTwo(e.keyCode);
});

// Start gry
const startGame = () => {
	let playerOneNameInput = document.getElementById('set-player-one-name').value;
	let playerTwoNameInput = document.getElementById('set-player-two-name').value;
	let playerVsComputerCheckbox = document.getElementById('player-vs-computer');

	menuSound.pause();
	startWhistle.play();
	matchSound.play();

	gameState.playerOneName =
		playerOneNameInput === '' ? 'PLAYER 1' : playerOneNameInput;

	if (playerVsComputerCheckbox.checked) {
		playerTwoNameInput = 'COMPUTER';
		document.getElementById('set-player-two-name').disabled = true;
	}

	gameState.playerTwoName =
		playerTwoNameInput === '' ? 'PLAYER 2' : playerTwoNameInput;

	document.querySelector('#player-one-name').innerHTML =
		gameState.playerOneName;
	document.querySelector('#player-two-name').innerHTML =
		gameState.playerTwoName;

	gameTime.innerHTML = formatTime(gameState.matchTime - gameState.currentTime);
	gameState.timeInterval = setInterval(setGameTime, 1000);

	let gameSettings = document.querySelector('.game-settings');
	let resetButton = gameSettings.querySelector('#reset');

	Array.from(gameSettings.children).forEach((child) => {
		if (child !== resetButton) {
			child.style.display = 'none';
		}
	});

	updateGame();
};

document.addEventListener('DOMContentLoaded', function () {
	menuSound.play();
});

window.onbeforeunload = function () {
	menuSound.pause();
	menuSound.currentTime = 0;
};

document.getElementById('reset').onclick = function () {
	window.location.reload();
};

document.getElementById('start').onclick = function () {
	startGame();
};

document.querySelector('.game-time').innerHTML = formatTime(
	gameState.matchTime
);

function changeGameTime(value) {
	let substractGameTimeButton = document.querySelector('.substract-game-time');
	gameState.matchTime += value;
	document.querySelector('.game-time').innerHTML = formatTime(
		gameState.matchTime
	);

	if (gameState.matchTime == 10) {
		gameState.matchTime = 10;
		substractGameTimeButton.disabled = true;
	} else {
		substractGameTimeButton.disabled = false;
	}
}

document.getElementsByClassName('add-game-time')[0].onclick = function () {
	changeGameTime(10);
};

document.getElementsByClassName('substract-game-time')[0].onclick =
	function () {
		changeGameTime(-10);
	};

document
	.getElementById('player-vs-computer')
	.addEventListener('change', function () {
		let playerTwoNameInput = document.getElementById('set-player-two-name');

		if (this.checked) {
			playerTwoNameInput.value = 'COMPUTER';
			playerTwoNameInput.disabled = true;
		} else {
			playerTwoNameInput.value = '';
			playerTwoNameInput.disabled = false;
		}
	});
