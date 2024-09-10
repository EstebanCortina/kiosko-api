import { app } from '@azure/functions';

app.http('MyHttpFunction', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        return { body: 'Hello from Azure Function!' };
    }
});