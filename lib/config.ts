interface Config {
  mongodb: {
    uri: string;
    db: string;
  };
  auth: {
    secret: string;
    url: string;
  };
  session: {
    secret: string;
  };
  app: {
    nodeEnv: string;
    isDevelopment: boolean;
    isProduction: boolean;
  };
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

function getOptionalEnvVar(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

export const config: Config = {
  mongodb: {
    uri: getRequiredEnvVar('MONGODB_URI'),
    db: getOptionalEnvVar('MONGODB_DB', 'shabnam-transactions'),
  },
  auth: {
    secret: getRequiredEnvVar('NEXTAUTH_SECRET'),
    url: getOptionalEnvVar('NEXTAUTH_URL', 'http://localhost:3000'),
  },
  session: {
    secret: getRequiredEnvVar('SESSION_SECRET'),
  },
  app: {
    nodeEnv: getOptionalEnvVar('NODE_ENV', 'development'),
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },
};

export default config;