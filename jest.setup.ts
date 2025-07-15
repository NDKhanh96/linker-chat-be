/**
 * Chứa import các thư viện cần thiết cho việc test.
 */

import '~utils/safe-execution-extension';

import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '.env.test.local') });
