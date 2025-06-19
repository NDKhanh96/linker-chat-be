import Supertest from 'supertest';

declare global {
    /**
     * Mở rộng interface của Promise để thêm phương thức toSafe
     */
    interface Promise<T> {
        /**
         * Xử lý ngoại lệ cho Promise mà không dùng try catch.
         *
         * Đầu ra là 1 mảng gồm 2 phần tử: error và result với index tương ứng.
         */
        toSafe(): Promise<[Error, null] | [null, T]>;
    }

    /**
     * Mở rộng interface của Function để thêm phương thức toSafe
     * toSafe và toSafeAsync có thể gây lỗi type nếu sử dụng với function nhiều overload
     * để xử lý có thể tách hàm như sau:
     * - const getBaseUrl = () => this.configService.get('BASE_URL', { infer: true });
     * - const [err, baseUrl] = getBaseUrl.toSafe();
     * * Lưu ý: toSafe và toSafeAsync không hoạt động với function mock của jest và sẽ lỗi do mock không 2 mở rộng này.
     */
    interface Function {
        /**
         * Xử lý ngoại lệ cho Function không có try catch.
         *
         * Đầu ra là 1 mảng gồm 2 phần tử: error và result với index tương ứng.
         *
         * Với trường hợp hàm phụ thuộc vào context (bên trong hàm có this) thì cần bind context vào hàm:
         *  - const [error, result] = verify.toSafe(token);
         *  - const [error, result] = this.jwtService.verify.bind(this.jwtService).toSafe(token);
         */
        toSafe<Args extends unknown[], R>(this: (...args: Args) => R, ...args: Args): [Error, null] | [null, R];

        /**
         * Xử lý ngoại lệ cho async function mà không cần try/catch.
         * Nếu function không trả về Promise sẽ throw error.
         * Đầu ra là [Error, null] hoặc [null, T].
         */
        toSafeAsync<Args extends unknown[], T>(this: (...args: Args) => Promise<T>, ...args: Args): Promise<[Error, null] | [null, T]>;
    }

    /**
     * Mở rộng interface của Supertest.Response để thêm thuộc tính body
     */
    type SRes<T> = Omit<Supertest.Response, 'body'> & { body: T };

    /**
     * Bọc lấy type T để làm phẳng các thuộc tính của nó.
     */
    type Prettify<T> = { [K in keyof T]: T[K] } & {};
}

export {};
