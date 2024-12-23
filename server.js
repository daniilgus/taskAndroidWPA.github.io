const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000; // Используем переменную окружения PORT

// Настройка подключения к базе данных
const pool = new Pool({
    user: 'postgres',
    host: 'postgres.railway.internal',
    database: 'railway',
    password: 'DDCBPiqrSGjagoiQdczkEvfzdSYPzuCc',
    port: 5432,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Обработчик для корневого маршрута
app.get('/', (req, res) => {
    res.send('Добро пожаловать на главную страницу!');
});

// Эндпоинт для получения списка пользователей
app.get('/users', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                Users.UserID, 
                Users.FirstName AS firstname, 
                Users.LastName AS lastname, 
                Roles.RoleName AS role,
                Users.Salary AS salary  
            FROM 
                Users 
            JOIN 
                Roles ON Users.RoleID = Roles.RoleID
        `);
        console.log('Полученные данные:', result.rows); // Логирование результата
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении пользователей:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Эндпоинт для обновления пользователя
app.put('/users/:id', async (req, res) => {
    const { id } = req.params; // Получаем ID пользователя из URL
    const { firstName, lastName, role } = req.body; // Получаем новые данные

    console.log('Обновляемые данные:', req.body); // Для отладки
    try {
        // Проверка, существует ли роль
        const roleResult = await pool.query('SELECT RoleID FROM Roles WHERE RoleName = \$1', [role]);
        if (roleResult.rows.length === 0) {
            console.error('Роль не найдена:', role);
            return res.status(400).json({ error: 'Роль не найдена' });
        }

        const roleID = roleResult.rows[0].roleid;

        // Обновление пользователя
        await pool.query('UPDATE Users SET FirstName = \$1, LastName = \$2, RoleID = \$3 WHERE UserID = \$4', 
            [firstName, lastName, roleID, id]);
        res.status(200).json({ message: 'Пользователь успешно обновлён' });
    } catch (error) {
        console.error('Ошибка при обновлении пользователя:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Функция для сохранения нового пользователя в базе данных
async function saveUserToDatabase(user) {
    const { firstName, lastName, login, password, role } = user;

    // Проверка, существует ли роль
    const roleResult = await pool.query('SELECT RoleID FROM Roles WHERE RoleName = \$1', [role]);
    if (roleResult.rows.length === 0) {
        throw new Error('Роль не найдена');
    }

    const roleID = roleResult.rows[0].roleid;

    // Вставка нового пользователя
    await pool.query('INSERT INTO Users (FirstName, LastName, Login, Password, RoleID) VALUES (\$1, \$2, \$3, \$4, \$5)', 
        [firstName, lastName, login, password, roleID]);
}

// Эндпоинт для регистрации нового пользователя
app.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, login, password, role } = req.body;

        // Валидация входящих данных
        if (!firstName || !lastName || !login || !password || !role) {
            return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
        }

        // Пример вызова функции для сохранения пользователя
        await saveUserToDatabase({ firstName, lastName, login, password, role });

        // Если все прошло успешно
        res.status(200).json({ message: 'Пользователь зарегистрирован успешно' });
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.status(500).json({ message: error.message || 'Ошибка сервера' });
    }
});

// Эндпоинт для авторизации
app.post('/login', async (req, res) => {
    const { login, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM Users WHERE Login = \$1 AND Password = \$2', [login, password]);
        
        if (result.rows.length > 0) {
            // Успешная авторизация
            res.json({ success: true });
        } else {
            // Неверный логин или пароль
            res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
        }
    } catch (error) {
        console.error('Ошибка при авторизации:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// Эндпоинт для удаления пользователя
app.delete('/users/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        await pool.query('DELETE FROM Users WHERE UserID = \$1', [userId]);
        res.status(204).send();
    } catch (error) {
        console.error('Ошибка при удалении пользователя:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
