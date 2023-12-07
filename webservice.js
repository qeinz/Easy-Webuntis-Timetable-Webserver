const http = require('http');
const {WebUntis} = require("webuntis");
const {parseISO, format, isValid} = require('date-fns');
const deLocale = require('date-fns/locale/de');
const cors = require('cors');
const {get} = require("axios");

const port = 3500;

const corsOptions = {
    origin: 'your origin',
    methods: ['POST', 'GET'],
    exposedHeaders: ['username', 'password', 'school', 'host'],
};

const server =
    http.createServer(async (req, res) => {
        cors(corsOptions)(req, res, async () => {

            res.writeHead(200, {
                'Content-Type': 'application/json'
            });

            try {
                let requestBody = '';

                req.on('data', (chunk) => {
                    requestBody += chunk.toString();
                });

                req.on('end', async () => {

                    if (!requestBody) {
                        res.end(JSON.stringify({error: 'Anfrage-Body ist leer'}));
                        return;
                    }

                    const {username, password, school, host} = JSON.parse(requestBody);

                    const urlParts = req.url.split('/');
                    const route = urlParts[1];

                    if (!school || !username || !password || !host) {
                        res.end(JSON.stringify({error: 'Anmeldedaten fehlen'}));
                        return;
                    }

                    const cleanedSchool = school.replace(/\+/g, ' ');

                    if (route === 'stundenplan' && urlParts[2] === 'weekly') {
                        const requestDate = urlParts[3];

                        if (!isValid(parseISO(requestDate))) {
                            res.end(JSON.stringify({error: `Ungültiges Datumsformat: yyyy-MM-dd`}));
                            return;
                        }

                        const customDate = parseISO(`${requestDate}T00:00:00.000Z`);

                        const untis = new WebUntis(cleanedSchool, username, password, host);
                        const loginResponse = await untis.login();

                        if (!loginResponse) {
                            res.end(JSON.stringify({error: 'Fehler beim Anmelden'}));
                            return;
                        }

                        const timetable = await untis.getOwnTimetableForWeek(customDate, 1);

                        function formatTime(time) {
                            const timeString = time.toString().padStart(4, '0');
                            const hours = timeString.substring(0, 2);
                            const minutes = timeString.substring(2);
                            return `${hours}:${minutes}`;
                        }

                        const extractedData = timetable
                            .filter(entry => entry.cellState !== "CANCEL")
                            .map(entry => {
                                const teachers = entry.teachers && entry.teachers[0] && entry.teachers[0].element ?
                                    entry.teachers[0].element.name : 'N/A';
                                const subjects = entry.subjects && entry.subjects[0] && entry.subjects[0].element ?
                                    entry.subjects[0].element.longName : 'N/A';
                                const rooms = entry.rooms && entry.rooms[0] && entry.rooms[0].element ?
                                    entry.rooms[0].element.displayname : 'N/A';

                                return {
                                    date: format(parseISO(entry.date.toString()), "yyyy-MM-dd"),
                                    dateName: format(parseISO(entry.date.toString()), "EEEE", {locale: deLocale}),
                                    startTime: formatTime(entry.startTime),
                                    endTime: formatTime(entry.endTime),
                                    teachers: teachers,
                                    subjects: subjects,
                                    rooms: rooms,
                                };
                            });

                        extractedData.sort((a, b) => {
                            if (a.date < b.date) return -1;
                            if (a.date > b.date) return 1;
                            return a.startTime.localeCompare(b.startTime);
                        });

                        const groupedData = {};

                        extractedData.forEach(entry => {
                            if (!groupedData[entry.date]) {
                                groupedData[entry.date] = [];
                            }
                            groupedData[entry.date].push(entry);
                        });

                        res.end(JSON.stringify(groupedData));

                    } else if (route === 'stundenplan' && urlParts[2] === 'raw') {
                        const requestDate = urlParts[3];

                        if (!isValid(parseISO(requestDate))) {
                            res.end(JSON.stringify({error: `Ungültiges Datumsformat: yyyy-MM-dd`}));
                            return;
                        }

                        const customDate = parseISO(`${requestDate}T00:00:00.000Z`);

                        const untis = new WebUntis(school, username, password, host);
                        const loginResponse = await untis.login();

                        if (!loginResponse) {
                            res.end(JSON.stringify({error: 'Fehler beim Anmelden'}));
                            return;
                        }

                        const timetable = await untis.getOwnTimetableForWeek(customDate, 1);

                        res.end(JSON.stringify(timetable));
                    } else if (route === 'inbox') {
                        try {
                            const untis = new WebUntis(cleanedSchool, username, password, host);

                            const loginResponse = await untis.login();

                            if (!loginResponse) {
                                res.end(JSON.stringify({error: 'Fehler beim Anmelden'}));
                                return;
                            }

                            const inbox = await untis.getInbox();
                            res.end(JSON.stringify(inbox));
                        } catch (error) {
                            console.error("Fehler beim Login:", error.message);
                            res.end(JSON.stringify({status: 'invalid', error: 'Ungültige Anmeldedaten'}));
                        }

                    } else {
                        res.end(JSON.stringify({error: 'Ungültige Route'}));
                    }
                });
            } catch (error) {
                console.error("Fehler beim Verarbeiten der Anfrage:", error.message);
                res.end(JSON.stringify({error: "Fehler beim Verarbeiten der Anfrage"}));
            }
        });
    });

server.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
});
