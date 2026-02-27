import { Router } from 'express';

const healthRouter = Router();

healthRouter.get('/', (request, response) => {
  response.status(200).json({
    status: 'ok',
  });
});

export default healthRouter;
