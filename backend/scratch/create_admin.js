require('dotenv').config();
require('dns').setServers(['8.8.8.8']);
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI, {
            autoIndex: false
        });
        console.log('Connected.');

        const email = 'admin@gmail.com';
        const password = '12345678';

        let adminUser = await User.findOne({ email });

        if (adminUser) {
            console.log('Admin user already exists. Updating password and role...');
            adminUser.password = password;
            adminUser.role = 'admin';
            adminUser.name = 'Admin User';
            await adminUser.save();
            console.log('Admin user updated successfully!');
        } else {
            console.log('Creating new admin user...');
            adminUser = await User.create({
                name: 'Admin User',
                email: email,
                password: password,
                role: 'admin'
            });
            console.log('Admin user created successfully!');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
