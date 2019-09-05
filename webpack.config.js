const path = require('path')

let noopPath = path.join(__dirname, 'src/modules/shims/noop')
let emptyPath = path.join(__dirname, 'src/modules/shims/empty')

module.exports = (env, argv) => ({
    entry: './src/components/App.js',

    output: {
        filename: 'bundle.js',
        path: __dirname
    },

    devtool: argv.mode === 'production' ? false : 'cheap-module-eval-source-map',

    module: {
        rules: [
          {
            exclude: [
                './node_modules/preact-material-components/Base',
                './node_modules/preact-material-components/Button',
                './node_modules/preact-material-components/Card',
                './node_modules/preact-material-components/Checkbox',
                './node_modules/preact-material-components/Chips',
                './node_modules/preact-material-components/Drawer',
                './node_modules/preact-material-components/Elevation',
                './node_modules/preact-material-components/Fab',
                './node_modules/preact-material-components/FormField',
                './node_modules/preact-material-components/GridList',
                './node_modules/preact-material-components/Icon',
                './node_modules/preact-material-components/IconButton',
                './node_modules/preact-material-components/IconToggle',
                './node_modules/preact-material-components/ImageList',
                './node_modules/preact-material-components/LayoutGrid',
                './node_modules/preact-material-components/LineRipple',
                './node_modules/preact-material-components/LinearProgress',
                './node_modules/preact-material-components/List',
                './node_modules/preact-material-components/Menu',
                './node_modules/preact-material-components/MenuSurface',
                './node_modules/preact-material-components/Radio',
                './node_modules/preact-material-components/Select',
                './node_modules/preact-material-components/Slider',
                './node_modules/preact-material-components/Snackbar',
                './node_modules/preact-material-components/Switch',
                './node_modules/preact-material-components/Tab',
                './node_modules/preact-material-components/TabBar',
                './node_modules/preact-material-components/TabIndicator',
                './node_modules/preact-material-components/TabScroller',
                './node_modules/preact-material-components/Tabs',
                './node_modules/preact-material-components/TextField',
                './node_modules/preact-material-components/Theme',
                './node_modules/preact-material-components/Toolbar',
                './node_modules/preact-material-components/TopAppBar',
                './node_modules/preact-material-components/Typography',
                './node_modules/preact-material-components/dist',
                './node_modules/preact-material-components/esm',
                './node_modules/preact-material-components/scripts',
                './node_modules/preact-material-components/themeUtils',
                './node_modules/preact-material-components/ts'
            ]
          }
        ]
    },

    node: {
        Buffer: false
    },

    node: {
        __dirname: false
    },

    resolve: {
        alias: {
            'react': path.join(__dirname, 'node_modules/preact/dist/preact.min'),
            'preact': path.join(__dirname, 'node_modules/preact/dist/preact.min'),
            'prop-types': path.join(__dirname, 'src/modules/shims/prop-types'),
            'fs': path.join(__dirname, 'src/modules/shims/fs'),
            'util': path.join(__dirname, 'src/modules/shims/util'),
            'electron': path.join(__dirname, 'src/modules/shims/electron'),
            'buffer': path.join(__dirname, 'src/modules/shims/buffer'),
            '@sabaki/boardmatcher': path.join(__dirname, 'src/modules/shims/boardmatcher'),
            'character-entities': emptyPath,
            'character-entities-html4': emptyPath,
            'character-entities-legacy': emptyPath,
            'character-entities-invalid': emptyPath,
            'character-reference-invalid': emptyPath,
            'moment': emptyPath,
            'uuid/v1': noopPath,
            'recursive-copy': noopPath,
            'rimraf': noopPath,
            'argv-split': path.join(__dirname, 'src/modules/shims/argv-split'), // BUGOUT
            '@sabaki/gtp': path.join(__dirname, 'src/modules/shims/gtp'),  // BUGOUT
            '../modules/gtplogger': path.join(__dirname, 'src/modules/shims/gtplogger'),
            '../modules/treetransformer': emptyPath,
            './i18n': path.join(__dirname, 'src/modules/shims/i18n'),
            '../i18n': path.join(__dirname, 'src/modules/shims/i18n'),
            '../../i18n': path.join(__dirname, 'src/modules/shims/i18n'),
            '../menu': emptyPath,

            './ThemeManager': noopPath,
            './LeftSidebar': noopPath,
            './GtpConsole': noopPath,
            './TextSpinner': noopPath,
            '../TextSpinner': noopPath,
            './drawers/AdvancedPropertiesDrawer': noopPath,
            './drawers/PreferencesDrawer': noopPath,
            './drawers/CleanMarkupDrawer': noopPath,
            './bars/AutoplayBar': noopPath,
            './bars/GuessBar': noopPath
        }
    },

    externals: {
        'moment': 'null',
        'iconv-lite': 'null',
        'jschardet': 'null'
    }
})
