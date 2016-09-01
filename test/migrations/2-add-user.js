export const id = '2-add-user';

export function up(query) {
  const sql = `INSERT INTO users (id, name) VALUES (?, ?)`;
  return query(sql, ['user-id', 'My user']);
}
