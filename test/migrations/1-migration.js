export const id = '1-migration';

export function up(query) {
  const sql = `CREATE TABLE users (
    id char(16),
    name varchar(50),
    PRIMARY KEY (id)
  ) ENGINE=INNODB`;
  return query(sql);
}
