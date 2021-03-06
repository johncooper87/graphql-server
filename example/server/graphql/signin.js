import jwt from 'jsonwebtoken';
import { types as _ } from '../../../src/graphql/types';
import { jwtSecret } from '../config.js';
import { verifyPassword } from '../../../src/auth/pwdhash';

const TokenType = _.Object({
  name: 'BearerToken',
  fields: {
    id: { type: _.NonNull(_.Int) },
    username: { type: _.NonNull(_.String) },
    email: { type: _.String },
    bearer: { type: _.String }
  }
});

const signIn = {
  type: TokenType,
  args: {
    login: { type: _.String },
    password: { type: _.String }
  },
  async resolve(obj, { login, password }, { db }) {
    const [user] = await db.query(
      `SELECT id, username, email, pwdhash FROM users WHERE ? IN (username, email)`,
      [login]
    );

    if (user !== undefined
      && verifyPassword(password, user.pwdhash)
    ) {
      delete user.pwdhash;
      return {
        ...user,
        bearer: jwt.sign(user, jwtSecret)
      };
    }
    // TODO: throw error
    throw new Error('Invalid login or password');
  }
};

export default { query: {
  signIn
}};