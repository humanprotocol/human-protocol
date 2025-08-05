enum EnvironmentName {
  LOCAL = 'local',
  DEVELOPMENT = 'development',
  TEST = 'test',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

class Environment {
  static readonly name: string =
    process.env.NODE_ENV || EnvironmentName.DEVELOPMENT;

  static isDevelopment(): boolean {
    return [
      EnvironmentName.DEVELOPMENT,
      EnvironmentName.TEST,
      EnvironmentName.LOCAL,
    ].includes(Environment.name as EnvironmentName);
  }

  static isTest(): boolean {
    return Environment.name === EnvironmentName.TEST;
  }
}

export default Environment;
