import express from 'express';
import { graphqlResolver } from '../../src/graphql/resolver';
import { dbConfig, jwtSecret } from './config.js';
import { userInfo } from '../../src/auth/userInfo';
import { schema, loaders } from './graphql';
import { errorLogger } from '../../src/error/errorLogger';
import { handleUncaughtErrors } from '../../src/error/handleUncaughtErrors';
import { PublicError } from '../../src/error/PublicError';
import { Pool } from '../../src/database/Pool';

import multer from 'multer';
const upload = multer();

//process.env.NODE_ENV = 'production';
process.env.NODE_ENV = 'development';

if (process.env.NODE_ENV === 'production') handleUncaughtErrors();

const app = express();

userInfo(jwtSecret)
  |> app.use(#);

const pool = new Pool(dbConfig);
async function graphqlOptions({ user }) {
  const db = await pool.getConnection();
  return [{
    user,
    db
  }, function() {
    if (db !== undefined) db.end();
  }];
}
graphqlResolver(schema, loaders, graphqlOptions)
  |> app.use('/graphql', upload.none(), #);

app.use('/error', () => {
  //throw new Error('Expected error');
  //throw new PublicError('Expected public error', 'Do nothing');
  try {
    throw new Error('Expected error');
  } catch(error) {
    throw new PublicError(error, 'Expected public error', 'Do nothing');
  }
});

app.use(errorLogger);

app.listen(8080);