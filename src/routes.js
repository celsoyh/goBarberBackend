import { Router } from 'express';
import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProviderController';
import AppointmentController from './app/controllers/AppointmentController';
import ScheduleController from './app/controllers/ScheduleController';
import NotificationController from './app/controllers/NotificationController';
import authMiddleware from './app/middlewares/auth';
import multer from 'multer';
import multerConfig from './config/multer';
const routes = Router();
const upload = multer(multerConfig);

routes.post('/user', UserController.store);

routes.post('/session', SessionController.store);

routes.use(authMiddleware);

routes.post('/files', upload.single('file'), FileController.store);

routes.put('/user', UserController.update);

routes.get('/providers', ProviderController.index);

routes.get('/appointment', AppointmentController.index);
routes.post('/appointment', AppointmentController.store);
routes.delete('/appointment/:id', AppointmentController.delete);

routes.get('/schedule', ScheduleController.index);

routes.get('/notification', NotificationController.index);
routes.put('/notification/:id', NotificationController.update);

export default routes;
