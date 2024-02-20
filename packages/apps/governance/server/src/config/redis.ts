import { createClient } from "redis";

export const client = createClient({
    socket: {
        port: Number(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST,
    }
});

client.on('error', err => console.log('Redis Client Error', err));

(async () => {
    await client.connect();
})();
