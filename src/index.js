const config = require('./config');
const Server = require('./server');


if(require.main === module) {
    (async () => {
        // this module is main i.e. we were started as a server;
        // not used in unit test or "require" scenarios
        const svr = new Server(config);

        // handle SIGTERM to exit gracefully
        process.on('SIGTERM', async () => {
            console.log('SIGTERM received. Shutting down APIs...');

            await svr.stop();
            process.exit(0);
        });

        await svr.setupApi();

        svr.start().catch(err => {
            console.log(err);
            process.exit(1);
        });
    })();
}
