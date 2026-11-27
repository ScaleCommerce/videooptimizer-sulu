import {transformSync} from '@babel/core';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

// The admin sources use Flow annotations and legacy decorators: strip them with Babel before Vite sees the code.
const babelSources = {
    name: 'vo-babel-sources',
    enforce: 'pre',
    transform(code, id) {
        if (!id.endsWith('.js') || id.includes('node_modules') || !id.startsWith(here('./'))) {
            return null;
        }
        const result = transformSync(code, {
            filename: id,
            babelrc: false,
            configFile: false,
            sourceMaps: true,
            presets: ['@babel/preset-react'],
            plugins: [
                ['@babel/plugin-proposal-decorators', {legacy: true}],
                '@babel/plugin-transform-flow-strip-types',
                '@babel/plugin-transform-class-properties',
            ],
        });

        return {code: result.code, map: result.map};
    },
};

export default defineConfig({
    plugins: [babelSources],
    resolve: {
        alias: {
            'sulu-admin-bundle/services': here('../../../tests/js/stubs/sulu-services.js'),
            'sulu-admin-bundle/utils': here('../../../tests/js/stubs/sulu-utils.js'),
        },
    },
    server: {fs: {strict: false}},
    test: {
        environment: 'jsdom',
        include: [here('../../../tests/js/**/*.test.js')],
        root: here('./'),
    },
});
