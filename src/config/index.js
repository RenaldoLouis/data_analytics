import devConfig from './development.config';
import prodConfig from './production.config';

const env = process.env.REACT_APP_ENV || 'development';

const config = {
  development: devConfig,
  production: prodConfig,
};

export default config[env];
