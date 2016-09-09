# MySQL migrations

Executes migration files for MySQL.

# Install

```
npm install --save @nielskrijger/mysql-migrations
```

# Example

```js
import Migrations from '@nielskrijger/logger';

const migrations = new Migrations({
  database: 'mysql_migrations',
  host: '127.0.0.1',
  port: 3306,
  user: 'test',
  password: 'test',
}, {});

migrations.run(`${__dirname}/migrations/*.js`);
```

**Options**

The signature `new Migrations(mysqlCfg, options)` accepts mysql connection options which are identical to [mysql.createPool()](https://github.com/mysqljs/mysql#pooling-connections). At a minimum `host`, `database`, `user` and `password` must be specified.

The second argument accepts the following options:

Option | Description
-------|-------------------------
info   | Function that logs info messages. Default `console.log`.
warn   | Function that logs warnings. Default `console.log`.
error  | Function that logs error messages. Default `console.log`.

# Run tests

Make sure to have a running MySQL server with the following database setup:

```sql
CREATE DATABASE mysql_migrations;
CREATE USER 'mysql_migrations'@'%' IDENTIFIED BY 'mysql_migrations';
GRANT ALL PRIVILEGES ON mysql_migrations.* TO 'mysql_migrations'@'%' WITH GRANT OPTION;
```

For convenience you can run `docker-compose up` to start a MySQL server.
