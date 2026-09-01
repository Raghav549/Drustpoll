import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pool } from './db.js';

const files = ['001_auth.sql','002_social_commerce.sql'];

async function main(){
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations(version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    for(const file of files){
      const exists=await client.query('SELECT 1 FROM schema_migrations WHERE version=$1',[file]);
      if(exists.rowCount)continue;
      const sql=await readFile(join(process.cwd(),'sql',file),'utf8');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(version) VALUES($1)',[file]);
      console.log(`applied ${file}`);
    }
    await client.query('COMMIT');
  }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();await pool.end();}
}
main().catch(error=>{console.error(error);process.exit(1);});
