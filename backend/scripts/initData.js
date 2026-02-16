require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const connectDB = require('../db');

// Initialize default data matching legacy app
const initData = async () => {
  try {
    await connectDB();

    // Create default users (matching legacy)
    const defaultUsers = [
      { username: 'admin', password: 'admin' },
      { username: 'user1', password: 'user1' },
      { username: 'user2', password: 'user2' }
    ];

    console.log('Creating default users...');
    for (const userData of defaultUsers) {
      const existingUser = await User.findOne({ username: userData.username });
      if (!existingUser) {
        const passwordHash = await User.hashPassword(userData.password);
        await User.create({
          username: userData.username,
          passwordHash
        });
        console.log(`Created user: ${userData.username}`);
      } else {
        console.log(`User ${userData.username} already exists`);
      }
    }

    // Create default projects (matching legacy)
    const defaultProjects = [
      { name: 'Proyecto Demo', description: 'Proyecto de ejemplo' },
      { name: 'Proyecto Alpha', description: 'Proyecto importante' },
      { name: 'Proyecto Beta', description: 'Proyecto secundario' }
    ];

    console.log('Creating default projects...');
    for (const projectData of defaultProjects) {
      const existingProject = await Project.findOne({ name: projectData.name });
      if (!existingProject) {
        await Project.create(projectData);
        console.log(`Created project: ${projectData.name}`);
      } else {
        console.log(`Project ${projectData.name} already exists`);
      }
    }

    console.log('Initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing data:', error);
    process.exit(1);
  }
};

initData();
