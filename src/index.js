import { connect, query } from '@nielskrijger/mysql';
import fs from 'fs';
import path from 'path';
import moment from 'moment';

/**
 * Configures migrations runner.
 */
class Migrations {

  /**
   * Instantiates a new mysql migrations runner and initializes database connection
   * pool.
   */
  constructor(mysqlConfig, config) {
    const requiredProperties = ['database', 'host', 'user', 'password'];
    requiredProperties.forEach(prop => {
      if (!mysqlConfig || mysqlConfig[prop] === undefined) {
        throw new Error(`Must specify mysql ${prop}`);
      }
    });

    this.cfg = Object.assign({
      error: console.log,
      warn: console.log,
      info: console.log,
    }, config);

    connect(mysqlConfig);
  }

  /**
   * Loads all migration files found in specified `directory` and runs them if
   * not already done.
   *
   * Migration files should export a variable `id` and function `up()`. The `id`
   * is a unique identifier used to determine whether the migration has already
   * run or not. The method `up()` should execute the actual migration and return
   * a promise. When the promise throws an error no subsequent migrations are run.
   */
  run(directory) {
    this.info('Creating MySQL tables and indexes');
    return this._ensureMigrationsTable().then(() => {
      return this._loadMigrationFiles(directory);
    }).then(migrations => {
      return migrations.reduce((p, migration) => {
        return p.then(() => this._runMigration(migration));
      }, Promise.resolve());
    });
  }

  /**
   * Returns array with migration files.
   */
  _loadMigrationFiles(glob) {
    return globby(glob).then(migrationFiles => {
      migrationFiles.sort();
      const migrations = [];
      for (const migrationFile of migrationFiles) {
        const migration = require(migrationFile); // eslint-disable-line global-require
        if (!migration.id) {
          throw new Error(`Migration file ${migrationFile} does not export an 'id'`);
        } else if (!migration.up) {
          throw new Error(`Migration file ${migrationFile} does not export a function 'up()'`);
        } else {
          migrations.push(migration);
        }
      }
      return migrations;
    });
  }

  /**
   * Ensures table migrations table exists which stores which migrations have run
   * and which haven't.
   */
  _ensureMigrationsTable() {
    const sql = `CREATE TABLE IF NOT EXISTS migrations (
      id varchar(254),
      executed_at timestamp(3),
      PRIMARY KEY (id)
    )`;
    return query(sql);
  }

  /**
   * Runs migration file if not already done so.
   */
  _runMigration(migration) {
    return this._getExecutedAt(migration.id).then(date => {
      if (date != null) {
        this.info(`Migration '${migration.id}' was executed on ${moment(date).format('YYYY-MM-DD HH:mm:ss Z')}`);
        return Promise.resolve();
      }

      return migration.up(query).then(() => {
        this.info(`✓ Executed migration '${migration.id}'`);
        return this._saveMigration(migration.id);
      }).catch(err => {
        this.error(`✘ Migration '${migration.id}' failed`, err);
        return Promise.reject(err);
      });
    });
  }

  /**
   * Retrieves executino time when a migration has run in the past.
   *
   * Returns a promise with a date or `null` when migration has not run before.
   */
  _getExecutedAt(migrationId) {
    const sql = 'SELECT * FROM migrations WHERE id = ?';
    return query(sql, [migrationId]).then(rows => {
      if (rows.length === 0) return null;
      return rows[0].executed_at;
    });
  }

  /**
   * Saves a migration has run.
   */
  _saveMigration(migrationId) {
    const now = moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS');
    const sql = `INSERT INTO migrations SET id = ?, executed_at = '${now}'`;
    return query(sql, [migrationId]);
  }

  info(msg) {
    this.cfg.info(msg);
  }

  warn(msg) {
    this.cfg.warn(msg);
  }

  error(msg) {
    this.cfg.error(msg);
  }
}

export default Migrations;

// Execute script if not require'd
if (!module.parent) {
  connect(config.get('mysql'));
  initMysql().then(() => {
    process.exit(0);
  });
}
