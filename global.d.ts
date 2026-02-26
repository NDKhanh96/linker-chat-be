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

    type MergeTypes<TypesArray extends unknown[], Res = unknown> = TypesArray extends [infer First, ...infer Rest] ? MergeTypes<Rest, Res & First> : Res;

    type OnlyFirst<F, S> = F & { [Key in keyof Omit<S, keyof F>]?: never };

    /**
     * Chỉ cho phép một trong các types được sử dụng (dạng array).
     * Sử dụng recursive pattern với MergeTypes - phù hợp cho nhiều types phức tạp.
     *
     * Ưu điểm: Xử lý tốt với nhiều types (>2), kiểm tra toàn bộ thuộc tính
     * Nhược điểm: Performance thấp hơn với types đơn giản
     *
     * @example
     * type Config = OneOfArray<[
     *   { url: string },
     *   { port: number },
     *   { socket: string }
     * ]>;
     */
    type OneOfArray<TypesArray extends unknown[], Res = never, AllProperties = MergeTypes<TypesArray>> = TypesArray extends [infer First, ...infer Rest]
        ? OneOfArray<Rest, Res | OnlyFirst<First, AllProperties>, AllProperties>
        : Res;

    type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

    type XOR<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

    /**
     * Chỉ cho phép một trong các types được sử dụng (dạng XOR).
     * Sử dụng XOR pattern - đơn giản và hiệu quả cho 2-3 types.
     *
     * Ưu điểm: Code đơn giản, performance tốt, autocomplete tốt hơn
     * Nhược điểm: Phức tạp khi dùng với >3 types
     *
     * @example
     * type Auth = OneOf<[
     *   { username: string; password: string },
     *   { token: string }
     * ]>;
     */
    type OneOf<T extends unknown[]> = T extends [infer A, infer B, ...infer Rest] ? OneOf<[XOR<A, B>, ...Rest]> : T extends [infer Only] ? Only : never;

    /**
     * Mở rộng interface của Supertest.Response để thêm thuộc tính body
     */
    type SRes<T> = Omit<Supertest.Response, 'body'> & { body: T };

    /**
     * Bọc lấy type T để làm phẳng các thuộc tính của nó.
     */
    type Prettify<T> = { [K in keyof T]: T[K] } & {};

    /**
     * Sinh ra tất cả các đường dẫn (path) dạng string đến các thuộc tính lồng nhau của object T.
     * Ví dụ:
     *   type P = Path<{ a: { b: { c: number }, d: string }, e: boolean }>
     *   // P = "a" | "a.b" | "a.b.c" | "a.d" | "e"
     *
     * Ứng dụng:
     *   - Tạo autocomplete cho field path khi truy vấn dữ liệu động, mapping, v.v.
     */
    type Path<T> = T extends object ? { [K in keyof T & string]: T[K] extends object ? K | `${K}.${Path<T[K]>}` : K }[keyof T & string] : never;
}

export {};
