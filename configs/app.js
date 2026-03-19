'use strict';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { dbConnection } from './db.js';
import { dbConnectionMongo } from './db-mongo.js';
import { corsOptions } from './cors-configuration.js';
import { helmetConfiguration } from './helmet-configuration.js';
import { requestLimit } from '../middlewares/request-limit.js';
import { errorHandler } from '../middlewares/server-genericError-handler.js';

import anaRoutes from '../src/ana/ana.routes.js';
import authRoutes from '../src/auth/auth.routes.js';
import userRoutes from '../src/users/user.routes.js';
import caregiversRoutes from '../src/caregivers/caregivers.routes.js';
import glucoseRoutes from '../src/glucose/glucose.routes.js';
import bloodPressureRoutes from '../src/bloodPressure/bloodPressure.routes.js';
import alertsRoutes from '../src/alerts/alerts.routes.js';

const BASE_PATH = '/api/v1';

const middlewares = (app) => {
    app.use(express.urlencoded({ extended: false, limit: '10mb' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(cors(corsOptions));
    app.use(helmet(helmetConfiguration));
    app.use(requestLimit);
    app.use(morgan('dev'));app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
};

const routes = (app) => {
    app.use(`${BASE_PATH}/auth`, authRoutes);
    app.use(`${BASE_PATH}/users`, userRoutes);
    app.use(`${BASE_PATH}/caregivers`, caregiversRoutes);
    app.use(`${BASE_PATH}/glucose`, glucoseRoutes);
    app.use(`${BASE_PATH}/blood-pressure`, bloodPressureRoutes);
    app.use(`${BASE_PATH}/alerts`, alertsRoutes);
    app.use(`${BASE_PATH}/ana`, anaRoutes);

    app.get(`${BASE_PATH}/health`, (req, res) => {
        res.status(200).json({
            status: 'Healthy',
            timestamp: new Date().toISOString(),
            service: 'Senior Health Monitoring API'
        });
    });

    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Endpoint no encontrado'
        });
    });
};

export const initServer = async () => {
    const app = express();
    const PORT = process.env.PORT;

    app.set('trust proxy', 1);

    try {
        await dbConnection();
        await dbConnectionMongo();
        
        // Seed roles
        const { seedRoles } = await import('../helpers/role-seed.js');
        await seedRoles();

        // Seed admin user automatically
        const { seedAdminUser } = await import('../data/seeder.js');
        await seedAdminUser();
        
        middlewares(app);
        routes(app);

        app.use(errorHandler);

        app.listen(PORT, () => {
            console.log(`Senior Health Monitoring server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}${BASE_PATH}/health`);
        });
    } catch (error) {
        console.error(`Error starting server: ${error.message}`);
        process.exit(1);
    }
};
