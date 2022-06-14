import express from "express";
import 'dotenv/config';
import { randomUUID } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import cors from 'cors';
const app = express();
const router = express.Router()

app.use(cors({
    origin: ['http://localhost:4200']
}));
app.use(express.json());
app.use('/api', router);

router.get('/test', (req, res) => {
    res.send('Hello World');
});

router.post('/admin/signup', (req,res) => {
    const requestBody = req.body;

    if (requestBody.email_id === undefined || requestBody.password === undefined) {
        return res.status(401).send({error: true, msg: 'Missing required fields'});
    }

    const admins = getAllAdmins();
    const findAdmin = admins.find(admin => admin.email_id === requestBody.email_id);
    
    if (findAdmin) {
        return res.status(409).send({error: true, msg: 'Email id already exist'});
    }

    admins.push(requestBody);
    saveAdminData(admins);
    res.status(201).send({success: true, msg: 'Account created successfully'});
})

router.post('/admin/login', (req,res) => {
    const requestBody = req.body;

    if (requestBody.email_id === undefined || requestBody.password === undefined) {
        return res.status(401).send({error: true, msg: 'Missing required fields'});
    }

    const admins = getAllAdmins();
    const admin = admins.find(admin => admin.email_id === requestBody.email_id && admin.password === requestBody.password);

    if (!admin) {
        return res.status(409).send({error: true, msg: 'Invalid email id or password'});
    }

    res.status(200).send({success: true, msg: 'Logged in successfully', token: `${admin.email_id}`});
})

router.post('/user', (req, res) => {

    if (!req.headers.authorization) {
        return res.status(401).send({error: true, msg: 'Unauthorized - needs token'});
    }

    const existingUsers = getAllUsers();
    const requestBody = req.body;

    if (requestBody.first_name === undefined || requestBody.last_name === undefined || requestBody.email_id === undefined) {
        return res.status(401).send({error: true, msg: 'User data missing'});
    }

    const findUser = existingUsers.find(user => user.email_id === requestBody.email_id);

    if (findUser) {
        return res.status(409).send({error: true, msg: 'Email id already exist'});
    }

    requestBody['id'] = randomUUID();
    existingUsers.push(requestBody);
    saveUserData(existingUsers);
    res.status(201).send({success: true, msg: 'User data added successfully'});
})

router.get('/users', (req, res) => {
    
    if (!req.headers.authorization) {
        return res.status(401).send({error: true, msg: 'Unauthorized - needs token'});
    }

    const users = getAllUsers();
    res.status(200).send(users);
})

router.get('/users/:userId', (req, res) => {

    if (!req.headers.authorization) {
        return res.status(401).send({error: true, msg: 'Unauthorized - needs token'});
    }

    const userId = req.params.userId;
    const users = getAllUsers();
    const user = users.find(user => user.id === userId);

    if (!user) {
        return res.status(404).send({success: true, msg: 'User id does not exist'});
    }

    res.status(200).send(user);

})

router.patch('/user/:userId', (req, res) => {

    if (!req.headers.authorization) {
        return res.status(401).send({error: true, msg: 'Unauthorized - needs token'});
    }

    const userId = req.params.userId;
    console.log(userId)
    const requestBody = req.body;
    const existingUsers = getAllUsers();
    const findUserIndex = existingUsers.findIndex(user => user.id === userId);

    if (!Object.keys(requestBody).every(key => key === 'first_name' || key === 'last_name' || key === 'email_id')) {
        return res.status(401).send({error: true, msg: 'User data missing'});
    }

    if (findUserIndex >= 0) {
        requestBody.first_name ? existingUsers[findUserIndex].first_name = requestBody.first_name : '';
        requestBody.last_name ? existingUsers[findUserIndex].last_name = requestBody.last_name : '';
        requestBody.email_id ? existingUsers[findUserIndex].email_id = requestBody.email_id : '';
    } else {
        return res.status(404).send({error: true, msg: 'User id does not exist'})
    }

    saveUserData(existingUsers);
    res.status(200).send({success: true, msg: 'User updated successfully'});
})

router.delete('/user/:userId', (req, res) => {

    if (!req.headers.authorization) {
        return res.status(401).send({error: true, msg: 'Unauthorized - needs token'});
    }

    const existingUsers = getAllUsers();
    const updatedUsersList = existingUsers.filter(user => user.id !== req.params.userId);

    if (existingUsers.length === updatedUsersList.length) {
        return res.status(409).send({error: true, msg: 'User id does not exist'})
    }

    saveUserData(updatedUsersList);
    res.status(200).send({success: true, msg: 'User deleted successfully'});
})

const getAllUsers = () => {
    const jsonData = readFileSync('users.json')
    return JSON.parse(jsonData)    
};

const saveUserData = (data) => {
    const stringifyData = JSON.stringify(data)
    writeFileSync('users.json', stringifyData)
};

const getAllAdmins = () => {
    const jsonData = readFileSync('admins.json')
    return JSON.parse(jsonData)    
};

const saveAdminData = (data) => {
    const stringifyData = JSON.stringify(data)
    writeFileSync('admins.json', stringifyData)
};

app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`);
})
