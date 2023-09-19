const http = require('http');
const {WebUntis} = require("webuntis");
const {parseISO, format, isValid} = require('date-fns');

const deLocale = require('date-fns/locale/de');

const port = 3000;

const server = http.createServer(async (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'application/json'
    });

    try {
        const urlParts = req.url.split('/');
        const route = urlParts[1];

        const school = req.headers['school'];
        const username = req.headers['username'];
        const password = req.headers['password'];
        const host = req.headers['host'];

        if (!school || !username || !password || !host) {
            res.end(JSON.stringify({error: 'Anmeldedaten fehlen'}));
            return;
        }

        if (route === 'stundenplan' && urlParts[2] === 'weekly') {
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

            function formatTime(time) {
                const timeString = time.toString().padStart(4, '0');
                const hours = timeString.substring(0, 2);
                const minutes = timeString.substring(2);
                return `${hours}:${minutes}`;
            }

            const extractedData = timetable
                .filter(entry => entry.cellState !== "CANCEL")
                .map(entry => ({
                    date: format(parseISO(entry.date.toString()), "yyyy-MM-dd"),
                    dateName: format(parseISO(entry.date.toString()), "EEEE", {locale: deLocale}),
                    startTime: formatTime(entry.startTime),
                    endTime: formatTime(entry.endTime),
                    teachers: entry.teachers[0].element.name,
                    subjects: entry.subjects[0].element.longName,
                    rooms: entry.rooms[0].element.displayname,
                }));

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
        } else {
            res.end(JSON.stringify({error: 'Ungültige Route'}));
        }
    } catch (error) {
        console.error("Fehler beim Abrufen des Stundenplans:", error.message);
        res.end(JSON.stringify({error: "Fehler beim Abrufen des Stundenplans"}));
    }
});

server.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
});
