/* global require, process, console, __dirname */
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

const fileName = path.resolve(__dirname, 'timelog.tmp');

const monthNames = ["January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December"
];

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];


// Returns object assoicated with new file
function createLogFile() {
	let timestamp = new Date().valueOf();
	console.log('Creating new log file');
	let obj = {
		timestamp
	};
	fs.writeFileSync(fileName, JSON.stringify(obj));
	return obj;
}

function initTimelog() {
	return new Promise(resolve => {
		fs.readFile(fileName, (err, data) => {
			if (err) {
				resolve(createLogFile());
			} else {
				let obj = JSON.parse(data);
				let today = new Date();
				let dayOfObj = new Date(obj.timestamp);
				if (today.getDate() !== dayOfObj.getDate()) {
					let dateString = dayOfObj.getFullYear() + '/' + monthNames[dayOfObj.getMonth()] + '/' + `${dayNames[dayOfObj.getDay()]}_${dayOfObj.getDate()}.txt`;
					console.log('New day, writing old log to history');
					let historyPath = path.resolve(__dirname, 'history', dateString);
					mkdirp(path.dirname(historyPath), function(err) {
						if (err)
							console.log(err);
						else {
							fs.writeFile(historyPath, timeLogToString(obj));
						}
					});
					resolve(createLogFile());
				} else {
					resolve(obj);
				}
			}
		});
	});
}
let initProm = initTimelog();

function persistTimelog(timelog) {
	fs.writeFileSync(fileName, JSON.stringify(timelog));
}

function milliToHours(millis) {
	return (millis / (3600000)).toFixed(2);
}

function timeLogToString(timelog) {
	let totalTime = 0;
	let projects = Object.keys(timelog).filter(item => item !== 'timestamp');
	let str = projects.map(project => {
		let time = timelog[project].reduce((aggr, time, index) => {
			return index % 2 === 1 ? aggr + time : aggr - time;
		}, 0);
		if (time < 0) {
			time += new Date().valueOf();
			project = '*' + project;
		}
		totalTime += time;
		return project + ': ' + milliToHours(time);
	}).join('\n');
	str += '\n\n';
	str += 'Total: ' + milliToHours(totalTime);
	return str;
}

function closeOut(timelog) {
	console.log(timeLogToString(timelog));
	persistTimelog(timelog);
}

function updateTimeLog(timelog, project) {
	let pRay = project.split(' ');
	if (pRay.length > 1) {
		let pName = pRay[1];
		switch (pRay[0]) {
			case '-r':
				delete timelog[pName];
				break;
		}
		closeOut(timelog);
		return;
	}
	if (project === 'new') {
		createLogFile();
		return;
	}
	if (project.toLowerCase() !== 'current') {
		// Close out previously open projects
		const currTimestamp = new Date().valueOf();
		let projects = Object.keys(timelog).filter(item => item !== 'timestamp' && item !== project);
		let currentProject = projects.find(item => timelog[item].length % 2 === 1);
		if (typeof currentProject !== 'undefined') {
			console.log("Stopping logging for entry " + currentProject);
			timelog[currentProject].push(currTimestamp);
		}

		// Open new project
		if (project !== 'stop') {
			if (!timelog[project]) {
				console.log("Starting new logging entry for " + project);
				timelog[project] = [currTimestamp];
			} else {
				timelog[project].push(currTimestamp);
				if (timelog[project].length % 2 == 0) {
					console.log("Stopping logging for entry " + project);
				} else {
					console.log("Restarting logging for entry " + project);
				}
			}
		}
	}
	closeOut(timelog);
}
initProm.then(timelog => {
	let projectArg = process.argv;
	if (projectArg.length <= 2) {
		console.log(
`Usage "timelog [-r]? project"
|    -r:   removes the project
|   words 'current' and 'stop' are reserved:
|   current: prints the current timelog
|   stop:    stops whatever is currently logging`);
	} else {
		updateTimeLog(timelog, projectArg.slice(2).join(' '));
	}
});

