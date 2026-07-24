const requiredEnvVars = ['TOKEN', 'CLIENT_ID', 'GUILD_ID', 'DB_FILE_NAME'] as const;

interface EnvVars {
  TOKEN: string;
  CLIENT_ID: string;
  GUILD_ID: string;
  NODE_ENV: 'development' | 'production';
  DB_FILE_NAME: string;
}

const resolveNodeEnv = (): 'development' | 'production' => {
  return process.env.NODE_ENV === 'development' ? 'development' : 'production';
};

const validateEnvVars = (): EnvVars => {
  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing environment variables: \n${missingEnvVars.map((envVar) => `- ${envVar}`).join('\n')}`);
  }

  return {
    ...Object.fromEntries(requiredEnvVars.map((envVar) => [envVar, process.env[envVar] as string])),
    NODE_ENV: resolveNodeEnv(),
  } as EnvVars;
};

export const env = validateEnvVars();
