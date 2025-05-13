import { type DataSourceOptions, DataSource } from 'typeorm';

const dataSourceOptions: DataSourceOptions = {
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: '',
    database: 'demo_nestjs',
    synchronize: false,
    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/db/migrations/*.js'],
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
