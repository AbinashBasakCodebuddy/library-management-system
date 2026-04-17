export interface EnvironmentVariables {
    PORT?: string;
    MONGO_URI: string;
    JWT_SECRET: string;
    NODE_ENV?: 'development' | 'production' | 'test' | 'staging';
}

declare global {
    namespace NodeJS {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface ProcessEnv extends EnvironmentVariables {}
    }
}
