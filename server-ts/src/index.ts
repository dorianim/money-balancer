/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { Router, Route, Request } from 'itty-router'

import registerUserRoutes from './routes/user';
import registerBalanceRoutes from './routes/balance';
import {requireAuthentication} from './middlewares/authentication';
import {json} from './utils/utils';

// Create a new router
const router = Router()

const userRouter = Router({ base: '/user' })
router.all('/user/*', userRouter.handle)
registerUserRoutes(userRouter)

const balanceRouter = Router({ base: '/balance' })
router.all('/balance/*', requireAuthentication, balanceRouter.handle)
registerBalanceRoutes(balanceRouter)

router.all("*", (request: Request) => {
	if(request.method === "OPTIONS") {
		return new Response();
	}

	return json({message: "endpoint not found"}, 404)
})

export default {
	fetch: (request: Request, ...extra: any) => router
						  .handle(request, ...extra)
						  .then(response => {
							// can modify response here before final return, e.g. CORS headers
							response.headers.set("Access-Control-Allow-Origin", "*")
							response.headers.set("Access-Control-Allow-Headers", "*")
							return response
						  })
						  .catch(err => {
							// and do something with the errors here, like logging, error status, etc
						  })
  }