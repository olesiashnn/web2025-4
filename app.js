const { program } = require('commander');
const http = require('http');
const fs = require('fs').promises;
const { Builder } = require('xml2js');

// Налаштування командного рядка
program
    .requiredOption('-h, --host <host>', 'Адреса сервера')
    .requiredOption('-p, --port <port>', 'Порт сервера')
    .requiredOption('-i, --input <file>', 'Шлях до файлу JSON');

program.parse(process.argv);
const options = program.opts();

// Функція для читання JSON-файлу та його аналізу
async function processJSONFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        const jsonData = JSON.parse(data);

        // Перевіряємо, чи jsonData є масивом
        if (!Array.isArray(jsonData)) {
            throw new Error('Невірний формат JSON');
        }

        // Фільтруємо потрібні категорії
        const filteredData = jsonData
            .filter(entry => entry.parent === 'BS3_BanksLiab')
            .map(entry => ({
                txt: entry.txten, // Вибираємо текстовий опис англійською
                value: entry.value
            }));

        // Формуємо XML
        const builder = new Builder();
        const xmlData = {
            data: {
                indicators: filteredData
            }
        };

        return builder.buildObject(xmlData);

    } catch (error) {
        console.error('Помилка при обробці JSON файлу:', error.message);
        return null;
    }
}

// Створення HTTP-сервера
const server = http.createServer(async (req, res) => {
    const xmlResponse = await processJSONFile(options.input);

    if (xmlResponse) {
        res.writeHead(200, { 'Content-Type': 'application/xml' });
        res.end(xmlResponse);
    } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Помилка при обробці JSON файлу');
    }
});

// Запуск сервера
server.listen(options.port, options.host, () => {
    console.log(`Сервер працює за адресою http://${options.host}:${options.port}/`);
});
