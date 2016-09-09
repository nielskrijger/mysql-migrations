import { query } from '@nielskrijger/mysql';
import { expect } from 'chai';
import Migrations from '../src';

function deleteTables() {
  const queries = [
    'DROP TABLE IF EXISTS users',
    'DROP TABLE IF EXISTS migrations',
  ];
  return Promise.all(queries.map(sql => query(sql)));
}

describe('MySQL migrations', () => {
  let migrations = null;
  let messages = null;

  beforeEach(() => {
    messages = [];
    const log = (lvl, msg) => {
      if (!messages[lvl]) messages[lvl] = [];
      messages[lvl].push(msg)
    };

    migrations = new Migrations({
      database: 'mysql_migrations',
      host: '127.0.0.1',
      port: 3306,
      user: 'mysql_migrations',
      password: 'mysql_migrations',
    });
    migrations.on('log', (lvl, msg) => log(lvl, msg));

    return deleteTables();
  });

  describe('run(...)', () => {
    it('should run migrations once', () => {
      return migrations.run(`${__dirname}/migrations/*.js`).then(() => {
        expect(messages.info.length).to.equal(3);
        expect(messages.info[1]).to.contain('Executed migration \'1-migration\'');
        expect(messages.info[2]).to.contain('Executed migration \'2-add-user\'');
        return migrations.run(`${__dirname}/migrations/*.js`);
      }).then(() => {
        expect(messages.info.length).to.equal(6);
        expect(messages.info[4]).to.contain('Migration \'1-migration\' was executed on');
        expect(messages.info[5]).to.contain('Migration \'2-add-user\' was executed on');
      });
    });
  });
});
